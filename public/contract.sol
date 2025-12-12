// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title MLM Defi Rewards System
 * @notice A secure multi-level marketing rewards system
 * @dev Implements referral, overrides and passive rewards
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    constructor() {
        _status = _NOT_ENTERED;
    }
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }
    
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }    

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

contract CROWDVAULT is Ownable, ReentrancyGuard {

    // ==================== CONSTANTS ====================
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_IN_A_DAY = 86400;
    uint256 private constant TOKEN_DECIMALS = 1e18;

    // ==================== STATE VARIABLES ====================
    IERC20 private usdtToken;
    address private projectWallet;
    address private bufferWallet;

    // PoolGuard Trigger On Off
    bool private withdrawalsPaused;
    uint256 private poolThreshold;
    uint256 private highestBalance;
    uint256 private cooldownEndTime;
    uint256 private cooldownPeriod;

    // Default Safety Parameters
    uint8 public maxRank;
    uint8 public maxCapped;
    uint8 public maxOverRide;
    uint8 public maxChildren;
    uint8 public maxCooldown;
    uint8 public maxIteration;
    uint8 public maxTimeDelay;
    uint256 public minWithdraw;
    uint256 public maxWithdraw;

    // Default Reward Rates (in basis points)
    uint256 public rewardsReferral;
    uint256 public rewardsOverRide;
    uint256 public rewardsPassivePct;
    uint256 public rewardsAgent;
    uint256 public rewardsProjectFunds;
    uint256 public rewardsBufferFunds;
    
    // Statistics
    uint256 public totalDeposits;
    uint256 public totalRewardsDistributed;
    uint256 public totalWithdrawals;
    uint256 public totalProjectFunding;
    uint256 public totalBufferFunding;
 
    // Structs
    struct AffiliateData {
        address parent;
        address[] children;
        address agent;
        uint8 level;
    }
    
    struct WalletData {
        uint256 balance;
        uint256 totalIncome;
        uint256 coolDown;
    }

    struct AgentData {
        address parent;
        address[] children;
        uint256 fees;
        uint256 totalIncome;
        bool isActive;
    }

    struct VaultData {
        uint256 amount;
        uint256 cap;
        uint256 coolDown;
    }
    mapping(address => mapping(uint8 => VaultData)) public vaults;

    // Mappings
    mapping(address => AffiliateData) public affiliates;
    mapping(address => WalletData) public wallets;
    mapping(address => AgentData) public agents;
    mapping(address => uint256) private lastCallBlock;
    mapping(address => uint256) private lastCallTime;

    // Accounts
    address[] public userAccounts;
    address[] public agentAccounts;

    // ==================== EVENTS ====================
    event InternalTransfer(string method, address indexed from, address indexed to, uint256 amount);
    event WithdrawBalance(address indexed from, address indexed to, uint256 amount);
    event DepositBalance(address indexed from, address indexed to, uint256 amount);

    event AffiliateUpdated(address indexed user, address indexed affiliate);
    event SettingsUpdated(string settingName, uint256 newValue);
    event AgentActivated(address indexed agent);
    event AccountActivated(address indexed user, uint8 newLevel);
    event Rewards(string rewardsName, address indexed from, address indexed to, uint256 newValue);

    // ==================== MODIFIERS ====================
    modifier isRegisteredUser() {
        require(affiliates[msg.sender].parent != address(0), "Unregistered user");
        _;
    }

    modifier isActiveAgent() {
        require(agents[msg.sender].isActive, "Inactive agent");
        _;
    }

    modifier poolGuard() {
        require(!withdrawalsPaused, "Withdrawals are paused");
        _;
    }  

    modifier antiSpam() {
        require(msg.sender == tx.origin, "AntiBot: EOAs only");
        require(msg.sender.code.length == 0, "AntiBot: Contract not allowed");
        require(lastCallBlock[msg.sender] != block.number, "AntiBot: one call per block");
        if (lastCallTime[msg.sender] != 0) { require(block.timestamp >= lastCallTime[msg.sender] + maxTimeDelay, "AntiBot: cooldown active");}
        _;
    }

    // ==================== ERRORS ====================
    error InvalidAddress();
    error CooldownPeriodActive();
    error InvalidBlock();
    error VaultIsActive();
    error InsufficientBalance();
    error WithdrawalLimit();
    error WalletExist();
    error WalletNotExist();
    error ReferralLimit();
    error InvalidInput();

    // ==================== CONSTRUCTOR ====================
    constructor() {
        withdrawalsPaused = false;
        poolThreshold = 5000;
        highestBalance = 0;
        cooldownEndTime = 0;
        cooldownPeriod = 3 hours;
        maxRank = 8;
        maxCapped = 3;
        maxOverRide = 3;
        maxChildren = 100;
        maxCooldown = 1;
        maxIteration = 100;
        maxTimeDelay = 6 seconds;
        minWithdraw = 20 * TOKEN_DECIMALS;
        maxWithdraw = 200 * TOKEN_DECIMALS;
        rewardsReferral = 1000;
        rewardsOverRide = 500;
        rewardsPassivePct = 200;
        rewardsAgent = 750;
        rewardsProjectFunds = 250;
        rewardsBufferFunds = 4000;

        usdtToken = IERC20(0x55d398326f99059fF775485246999027B3197955);
        projectWallet = address(0x160e91F55D9acCd910737aCBc32d79543B2e0848);
        bufferWallet = address(0xd486FFAEAD13C421c3A78d752d4ef4BCAf542bbc);

        lastCallBlock[msg.sender] = block.number;
        lastCallTime[msg.sender] = block.timestamp;

        affiliates[msg.sender] = AffiliateData({
            parent: address(this),
            children: new address[](0),
            agent: msg.sender,
            level: maxRank
        });
        userAccounts.push(msg.sender);
        wallets[msg.sender] = WalletData({
            balance: 10240 * TOKEN_DECIMALS,
            totalIncome: 0,
            coolDown: block.timestamp
        });   
        agents[msg.sender] = AgentData({
            parent: address(this),
            children: new address[](0),
            fees: rewardsAgent,
            totalIncome: 0,
            isActive: true
        });
        agentAccounts.push(msg.sender);
    }

    // ==================== USER FUNCTIONS ====================
    function register(address _referrer) external nonReentrant antiSpam {
        _validateRegistrationInputs(msg.sender, _referrer);
        _registerUser(msg.sender, _referrer);
        userAccounts.push(msg.sender);
        lastCallBlock[msg.sender] = block.number;
        lastCallTime[msg.sender] = block.timestamp;
    }

    function depositBalance(uint256 _amount) external nonReentrant antiSpam isRegisteredUser {
        require(usdtToken.balanceOf(address(msg.sender)) >= _amount, "Insufficient USDT balance");
        require(usdtToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        WalletData storage wallet = wallets[msg.sender];
        wallet.balance += _amount;
        wallet.coolDown = block.timestamp + maxTimeDelay;
        totalDeposits += _amount;
        _distributeFundings(_amount);
        _poolGuard();
        lastCallBlock[msg.sender] = block.number;
        lastCallTime[msg.sender] = block.timestamp;
        emit DepositBalance(msg.sender, address(this), _amount);
    }

    function activateVIP() external nonReentrant antiSpam isRegisteredUser {
        AffiliateData storage affiliate = affiliates[msg.sender];
        uint8 level = affiliate.level>=maxRank ? maxRank : affiliate.level;
        uint256 upgradeAmount = calculateUpgradeAmount(level);
        WalletData storage wallet = wallets[msg.sender];
        VaultData storage vault = vaults[msg.sender][level];
        if (vault.cap>0 && level<maxRank) revert  VaultIsActive();
        if (wallet.balance < upgradeAmount) revert InsufficientBalance();
        wallet.balance -= upgradeAmount;
        wallet.coolDown = block.timestamp + maxTimeDelay;
        affiliate.level +=1;
        _activateAccount(msg.sender, upgradeAmount, level);
        _poolGuard();
        lastCallBlock[msg.sender] = block.number;
        lastCallTime[msg.sender] = block.timestamp;
    }

    function collectPassive(uint8 _level) external nonReentrant antiSpam {
        WalletData storage wallet = wallets[msg.sender];
        VaultData storage vault = vaults[msg.sender][_level];
        uint256 passiveRewards = _calculatePassiveReward(msg.sender, _level);
        if (vault.cap == 0 ) revert InsufficientBalance();
        if (block.timestamp < vault.coolDown + SECONDS_IN_A_DAY) revert CooldownPeriodActive();
        wallet.balance += passiveRewards;
        wallet.totalIncome += passiveRewards;
        vault.cap -= passiveRewards;
        vault.coolDown = block.timestamp;
        totalRewardsDistributed += passiveRewards;
        _poolGuard();
        lastCallBlock[msg.sender] = block.number;
        lastCallTime[msg.sender] = block.timestamp;
        emit InternalTransfer("passive", address(this), msg.sender, passiveRewards);
    }

    function withdrawBalance(uint256 _amount) external nonReentrant antiSpam poolGuard {
        WalletData storage wallet = wallets[msg.sender];
        _poolGuard();
        uint256 transferAmount = calculateWithdrawAmount(_amount);
        if (transferAmount < minWithdraw) revert WithdrawalLimit();
        if (transferAmount > maxWithdraw) revert WithdrawalLimit();
        if (wallet.balance < transferAmount) revert InsufficientBalance();
        if (usdtToken.balanceOf(address(this)) < transferAmount) revert InsufficientBalance();
        uint256 coolDown = (block.timestamp - wallet.coolDown) / SECONDS_IN_A_DAY;
        if (coolDown < maxCooldown) revert CooldownPeriodActive();
        _safeTransfer( msg.sender, transferAmount);
        wallet.balance -= transferAmount;
        wallet.coolDown = block.timestamp;
        totalWithdrawals += transferAmount;
        lastCallBlock[msg.sender] = block.number;
        lastCallTime[msg.sender] = block.timestamp;
        emit WithdrawBalance(address(this), msg.sender, transferAmount);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getAffiliateData(address _user) 
    public view returns ( address parent, address agent, uint8 level, uint256 childrenCount){
        AffiliateData storage affiliate = affiliates[_user];
        return (
            affiliate.parent,
            affiliate.agent,
            affiliate.level,
            affiliate.children.length
        );
    }

    function getAgentData(address _user) 
    public view returns (address parent, uint256 fees, uint256 totalIncome, bool isActive, uint256 childrenCount) {
        require(agents[_user].parent != address(0), "Agent does not exist");
        AgentData storage agent = agents[_user];
        return (
            agent.parent,
            agent.fees,
            agent.totalIncome / TOKEN_DECIMALS,
            agent.isActive,
            agent.children.length
        );
    }   

    function getChildren(
        bool _isAffiliate,
        address _user,
        uint256 _startIndex,
        uint256 _count)
    public view returns (address[] memory childrenBatch) {
        address[] storage children = _isAffiliate 
            ? affiliates[_user].children 
            : agents[_user].children;
        
        uint256 totalChildren = children.length;
        
        if (_startIndex >= totalChildren || _count == 0) {
            return new address[](0);
        }
        uint256 endIndex = _startIndex + _count;
        if (endIndex > totalChildren) {
            endIndex = totalChildren;
        }
        childrenBatch = new address[](endIndex - _startIndex);
        for (uint256 i = _startIndex; i < endIndex; i++) {
            childrenBatch[i - _startIndex] = children[i];
        }
        return childrenBatch;
    }

    function getWalletData(address _user)
    public view returns (uint256 balance, uint256 totalIncome, uint256 coolDown) {
        WalletData storage wallet = wallets[_user];
        return (
            wallet.balance / TOKEN_DECIMALS,
            wallet.totalIncome / TOKEN_DECIMALS,
            wallet.coolDown
        );
    }

    function getLastBlockTime(address _user) 
    public view returns (uint256) {
        return lastCallTime[_user];
    }

    function getLastBlockNumber(address _user) 
    public view returns (uint256) {
        return lastCallBlock[_user];
    }    

    function getVaultData(address _user, uint8 _level)
    public view returns (uint256 amount, uint256 cap, uint256 coolDown) {
        VaultData storage vault = vaults[_user][_level];
        return (
            vault.amount / TOKEN_DECIMALS,
            vault.cap / TOKEN_DECIMALS,
            vault.coolDown
        );
    }

    function getPassiveReward(address _user, uint8 _level) 
    public view returns (uint256) {
        return _calculatePassiveReward(_user,_level) / TOKEN_DECIMALS ;
    }

    function getContractStats() 
    public view returns (
        uint256 totalUsers,
        uint256 totalAgents,
        uint256 contractBalance,
        uint256 _totalDeposits,
        uint256 _totalRewardsDistributed,
        uint256 _totalWithdrawals
    ) {
        return (
            userAccounts.length,
            agentAccounts.length,
            usdtToken.balanceOf(address(this)) / TOKEN_DECIMALS,
            totalDeposits / TOKEN_DECIMALS,
            totalRewardsDistributed / TOKEN_DECIMALS,
            totalWithdrawals / TOKEN_DECIMALS
        );
    }

    function getPoolGuardData() 
    public view returns (
        uint256 _poolThreshold,
        uint256 _highestBalance,
        uint256 _cooldownEndTime,
        bool _withdrawalsPaused
    ) {
        return (
            poolThreshold,
            highestBalance / TOKEN_DECIMALS,
            cooldownEndTime,
            withdrawalsPaused
        );
    }

    function getActiveVault(address _user, uint256 reward )
    public view returns (uint _level, uint256 _lowestCap ){
        (uint8 level, uint256 lowestCap) = _getVaultMinCap(_user, reward);
        return ( level, lowestCap);
    }

    function calculateUpgradeAmount(uint8 _level)
    public view returns (uint256) {
        uint256[9] memory amounts = [
            10 * TOKEN_DECIMALS,   // level 0
            50 * TOKEN_DECIMALS,   // level 1  
            100 * TOKEN_DECIMALS,  // level 2
            200 * TOKEN_DECIMALS,  // level 3
            400 * TOKEN_DECIMALS,  // level 4
            800 * TOKEN_DECIMALS,  // level 5
            1600 * TOKEN_DECIMALS, // level 6
            3200 * TOKEN_DECIMALS, // level 7
            6400 * TOKEN_DECIMALS  // level 8
        ];
        //require(_level < amounts.length, "Invalid level");
        uint8 level = _level < amounts.length ? _level : maxRank;
        return amounts[level];
    }

    function calculateWithdrawAmount(uint256 _amount) 
    public pure returns (uint256) {
        return _amount < 20000000000000000000 ? 0 
        : _amount < 50000000000000000000 ? 20000000000000000000 
        : _amount < 100000000000000000000 ? 50000000000000000000 
        : _amount < 200000000000000000000 ? 100000000000000000000 : 200000000000000000000;
    }    

    // ==================== PRIVATE FUNCTIONS ====================

    function _registerUser(address _newUser, address _referrer)
    private {
        AffiliateData memory affiliate = affiliates[_referrer];
        affiliates[_newUser] = AffiliateData({
            parent: _referrer,
            children: new address[](0),
            agent: affiliate.agent,
            level: 0
        });
        affiliates[_referrer].children.push(_newUser);
        agents[affiliate.agent].children.push(_newUser);
        wallets[_newUser] = WalletData({
            balance: 0,
            totalIncome: 0,
            coolDown: block.timestamp + maxTimeDelay
        });
        lastCallBlock[_newUser] = block.number;
        lastCallTime[_newUser] = block.timestamp;
    }

    function _activateAccount(address _user, uint256 _amount, uint8 _level)
    private {

        AffiliateData memory affiliate = affiliates[_user];
        VaultData storage vault = vaults[_user][_level];
        
        vault.amount = _amount;
        vault.coolDown = block.timestamp + maxTimeDelay;
        vault.cap += _amount*maxCapped;
    
        _distributeReferralRewards(_user, _amount);
        _distributeOverRideRewards(_user, _amount);
        _distributeMasterAgent(affiliate.agent, _amount);
        emit AccountActivated(_user, _level);
    }

    function _distributeMasterAgent(address _agent, uint256 _amount)
    private {
        AgentData storage agent = agents[_agent];
        AgentData storage agentParent = agents[agent.parent];
        
        uint256 agentRewards = (_amount * agent.fees) / BASIS_POINTS;
        address masterWallet = agent.parent;
        uint256 masterRewards = (_amount * agentParent.fees) / BASIS_POINTS;
        if ( agent.fees == 0 ) return;
        if ( usdtToken.balanceOf(address(this)) < (_amount * rewardsAgent) / BASIS_POINTS ) return;

        if ( agentRewards > 0 ) {
            require(usdtToken.transfer(_agent, agentRewards), "Transfer failed");
            emit Rewards("agentRewards", address(this), _agent, agentRewards);
        }
        if ( masterRewards > agentRewards ) {
            masterRewards = masterRewards - agentRewards;
            require(usdtToken.transfer(masterWallet, masterRewards), "Transfer failed");
            emit Rewards("masterRewards", address(this), masterWallet, masterRewards);
        }
    }

    function _distributeFundings( uint256 _amount)
    private {
        uint256 projectFunding = (_amount * rewardsProjectFunds) / BASIS_POINTS;
        if (usdtToken.balanceOf(address(this)) >= projectFunding) {
            require(usdtToken.transfer(projectWallet, projectFunding), "Transfer failed");
            totalProjectFunding += projectFunding;
            emit Rewards("projectFunding", projectWallet, address(this), projectFunding);
        }
        uint256 bufferFunding = (_amount * rewardsBufferFunds) / BASIS_POINTS;
        if (usdtToken.balanceOf(address(this)) >= bufferFunding) {
            require(usdtToken.transfer(bufferWallet, bufferFunding), "Transfer failed");
            totalBufferFunding += bufferFunding;
            emit Rewards("bufferFunding", bufferWallet, address(this), bufferFunding);
        }        
    }

    function _distributeReferralRewards(address _user, uint256 _amount)
    private {
        address referrer = affiliates[_user].parent;
        if (referrer == address(0) || referrer == address(this) ) return;
        WalletData storage referrerWallet = wallets[referrer];
        uint256 reward = (_amount * rewardsReferral) / BASIS_POINTS;
        (uint8 level, uint256 lowestCap) = _getVaultMinCap(referrer, reward);
        VaultData storage vault = vaults[referrer][level];
        if( lowestCap==0 ) return;
        reward = lowestCap >= reward ? reward : lowestCap;
        _safeTransfer( referrer, reward );
        referrerWallet.totalIncome += reward;
        totalRewardsDistributed += reward;
        vault.cap -= reward;
        emit Rewards("ReferralRewards", _user, referrer, reward);
    }

    function _distributeOverRideRewards(address _user, uint256 _amount)
    private {
        AffiliateData memory affiliate = affiliates[_user];
        address currentParent = affiliate.parent;
        uint256 reward = (_amount * rewardsOverRide) / BASIS_POINTS;
        uint8 currentLevel = affiliate.level;
        uint8 rewardsGiven = 0;
        uint8 levelsTraversed = 0;
        if (currentLevel >= maxRank) return;
        while (currentParent != address(0) && rewardsGiven < maxOverRide && levelsTraversed < maxIteration) {
            AffiliateData memory parent = affiliates[currentParent];
            WalletData storage wallet = wallets[currentParent];
            
            (uint8 level, uint256 lowestCap) = _getVaultMinCap(currentParent, reward);
            VaultData storage vault = vaults[currentParent][level];

            if (currentLevel < parent.level && lowestCap >= reward) {
                wallet.balance += reward;
                wallet.totalIncome += reward;
                totalRewardsDistributed += reward;
                rewardsGiven++;
                currentLevel = parent.level;
                vault.cap -= reward;
                emit Rewards("OverRideRewards", _user, currentParent, reward);
            }
            currentParent = parent.parent;
            levelsTraversed++;
        }
    }

    function _calculatePassiveReward(address _user, uint8 _level)
    private view returns (uint256) {
        VaultData memory vault = vaults[_user][_level];
        if( vault.coolDown==0 || vault.amount==0 || vault.cap==0 ) return 0;
        uint256 maturedDays = (block.timestamp - vault.coolDown) / SECONDS_IN_A_DAY;
        uint256 passiveValue = (maturedDays * vault.amount * rewardsPassivePct) / BASIS_POINTS;
        return passiveValue > vault.cap ? vault.cap : passiveValue;
    }
    
    function _validateRegistrationInputs(address _user, address _referrer)
    private view {
        if (affiliates[_user].parent != address(0)) revert WalletExist();
        if (affiliates[_referrer].parent == address(0)) revert WalletNotExist();
        if (affiliates[_referrer].children.length >= maxChildren) revert ReferralLimit();
    }

    function _removedChild(address _parent, address _child, bool isAffiliates)
    private {
        address[] storage children = isAffiliates ? affiliates[_parent].children : agents[_parent].children;
        uint256 length = children.length;
        for (uint256 i = 0; i < length; i++) {
            if (children[i] == _child) {
                if (i != length - 1) {
                    children[i] = children[length - 1];
                }
                children.pop();
                return;
            }
        }
    }
    
    function _poolGuard()
    internal {
        uint256 currentBalance = usdtToken.balanceOf(address(this));
        if (currentBalance > highestBalance) {
            withdrawalsPaused = false;
            highestBalance = currentBalance;
            cooldownEndTime = block.timestamp;
        }
        uint256 threshold = (highestBalance * poolThreshold) / BASIS_POINTS;
        if (currentBalance <= threshold && !withdrawalsPaused) {
            withdrawalsPaused = true;
            cooldownEndTime = block.timestamp + cooldownPeriod;
        }
        if (withdrawalsPaused && block.timestamp >= cooldownEndTime) {
            withdrawalsPaused = false;
            highestBalance = currentBalance;
            cooldownEndTime = block.timestamp;
        }
    }

    function _safeTransfer(address _user, uint256 _amount) internal {
        require(_user != address(0), "Invalid recipient");
        if (_user != bufferWallet && _user != projectWallet) {
            if (lastCallBlock[_user] == block.number) {revert InvalidBlock();}
        }
        if (usdtToken.balanceOf(address(this)) < _amount) revert InsufficientBalance();
        lastCallBlock[_user] = block.number;
        lastCallTime[_user] = block.timestamp;
        require(usdtToken.transfer(_user, _amount), "Transfer failed");
    }
    
    function _getVaultMinCap(address _user, uint256 _reward) private view returns (uint8 level, uint256 lowestCap) {
        bool found = false;
        
        for (uint8 i = 0; i < 9; i++) {
            VaultData storage v = vaults[_user][i];
            if (v.amount == 0 || v.cap < _reward) continue;
            
            if (!found || v.cap < lowestCap) {
                lowestCap = v.cap;
                level = i;
                found = true;
            }
        }
        if (!found) {
            lowestCap = 0;
            level = 0;
        }
    }

    // ==================== ADMIN FUNCTIONS ====================

    function updateWalletData(
        address _user,
        uint256 _balance,
        uint256 _totalIncome,
        uint256 _coolDown) 
    external onlyOwner {
        require(affiliates[_user].parent != address(0), "Unregistered user");
        WalletData storage wallet = wallets[_user];
        if( _balance > 0 ) wallet.balance =  _balance;
        if( _totalIncome > 0 ) wallet.totalIncome =  _totalIncome;
        if( _coolDown > 0 ) wallet.coolDown =  _coolDown;
    }

    function updateVaultData(
        address _user,
        uint8 _level,
        uint256 _amount,
        uint256 _coolDown,
        uint256 _cap)
    external onlyOwner {
        require(affiliates[_user].parent != address(0), "Unregistered user");
        require(wallets[_user].coolDown>0 , "Wallet Not Found");
        VaultData storage vault = vaults[_user][_level];
        if( _amount > 0 ) vault.amount =  _amount;
        if( _coolDown > 0 ) vault.coolDown =  _coolDown;
        if( _cap >= 0 ) vault.cap =  _cap;
    }

    function updateAffiliateData(
        address _user,
        address _parent,
        address _agent,
        uint8 _level)
    external onlyOwner {
        require(affiliates[_user].parent != address(0), "Unregistered user");
        AffiliateData storage affiliate = affiliates[_user];
        if( _level > 0 ) affiliate.level =  _level;
        if( _parent != address(0) ){
            address oldParent = affiliate.parent;
            _removedChild(oldParent,_user, true );
            affiliate.parent =  _parent;
            AffiliateData storage parent = affiliates[_parent];
            parent.children.push(_user);
        }
        if( _agent != address(0) ){
            address oldAgent = affiliate.agent;
            _removedChild(oldAgent,_user, false );
            affiliate.agent =  _agent;
            AgentData storage agent = agents[_agent];
            agent.children.push(_user);
        }
    }

    function updateAgentData(
        address _user,
        address _parent,
        uint256 _fees,
        uint256 _totalIncome,
        bool _isActive)
    external onlyOwner {
        require(affiliates[_user].parent != address(0), "Unregistered user");
        AgentData storage agent = agents[_user];
        
        if(_parent != address(0)) {
            require(agents[_parent].parent != address(0), "Unregistered parent");
            agent.parent = _parent;
            _removedChild(_parent, _user, false);
            agents[_parent].children.push(_user);
        }
        if(_fees >= 0) agent.fees = _fees;
        if(_totalIncome > 0) agent.totalIncome = _totalIncome;
        if(_isActive != agent.isActive) agent.isActive = _isActive;
    }  

    function activateAgent(
        address _agent, 
        address _master, 
        uint256 _rewards ) 
    external onlyOwner {
        require(agents[_agent].parent == address(0), "User Found");
        require(agents[_master].parent != address(0), "User Not Found");
        require(affiliates[_agent].parent != address(0), "User Not Found");
        AffiliateData storage affiliate = affiliates[_agent];
        
        agents[_agent] = AgentData({
            parent: _master,
            children: new address[](0),
            fees: _rewards,
            totalIncome: 0,
            isActive: true
        });
        agentAccounts.push(_agent);
        agents[_master].children.push(_agent);
        affiliate.agent = _agent;
        emit AgentActivated(_agent);
    }
    
}