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
    uint8 public maxTimeDelay;
    uint8 public maxIteration;
    uint256 public minWithdraw;
    uint256 public maxWithdraw;

    // Default Fee Structure
    uint256 public regFee;
    uint256 public entryFee;
    uint256 public agentFee;

    // Default Reward Rates (in basis points)
    uint256 public rewardsReferral;
    uint256 public rewardsOverRide;
    uint256 public rewardsPassiveMin;
    uint256 public rewardsPassiveMax;
    uint256 public rewardsAgent;
    uint256 public rewardsProjectFunds;
    uint256 public rewardsBufferFunds;
    uint256 public rewardsDeduction;
    
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
        uint256 capping;
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

    struct PassiveData {
        uint256 value;
        uint256 activeIncome;
        uint256 lastDeposit;
        uint256 coolDown;
    }

    struct VaultData {
        uint256 amount;     // total deposit amount for this level
        uint256 coolDown;   // timestamp of last collection or deposit
        uint256 cap;        // 300% of amount
    }
    mapping(address => mapping(uint8 => VaultData)) public vaults;

    // Mappings
    mapping(address => AffiliateData) public affiliates;
    mapping(address => WalletData) public wallets;
    mapping(address => AgentData) public agents;
    mapping(address => PassiveData) public passives;
    mapping(address => uint256) private lastCallBlock;
    mapping(address => uint256) private lastCallTime;

    // Accounts
    address[] public userAccounts;
    address[] public agentAccounts;

    // ==================== EVENTS ====================
    event InternalTransfer(string method, address indexed from, address indexed to, uint256 amount);
    event AffiliateUpdated(address indexed user, address indexed affiliate);
    event SettingsUpdated(string settingName, uint256 newValue);
    event AgentActivated(address indexed agent);
    event AccountActivated(address indexed user, uint8 newLevel);
    event Rewards(string rewardsName, address indexed from, address indexed to, uint256 newValue);

    // ==================== MODIFIERS ====================
    modifier isActiveUser() {
        require(wallets[msg.sender].capping > 0, "Inactive user");
        _;
    }

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
        require(lastCallBlock[tx.origin]==0 || lastCallBlock[tx.origin] != block.number, "AntiBot: one call per block");
        require(lastCallTime[tx.origin]==0 || block.timestamp >= lastCallTime[tx.origin] + maxTimeDelay, "AntiBot: cooldown active");
        lastCallBlock[tx.origin] = block.number;
        lastCallTime[tx.origin] = block.timestamp;
        _;
    }

    // ==================== ERRORS ====================
    error InvalidAddress();
    error CooldownPeriodActive();
    error InsufficientBalance();
    error WithdrawalLimit();
    error WalletExist();
    error WalletNotExist();
    error ReferralLimit();
    error InvalidInput();

    // ==================== CONSTRUCTOR ====================
    constructor() {
        usdtToken = IERC20(0x55d398326f99059fF775485246999027B3197955);
        projectWallet = address(0x160e91F55D9acCd910737aCBc32d79543B2e0848);
        bufferWallet = address(0xd486FFAEAD13C421c3A78d752d4ef4BCAf542bbc);
        affiliates[msg.sender] = AffiliateData({
            parent: address(this),
            children: new address[](0),
            agent: msg.sender,
            level: 10
        });
        userAccounts.push(msg.sender);
        wallets[msg.sender] = WalletData({
            balance: 10240 * TOKEN_DECIMALS,
            capping: 10240 * TOKEN_DECIMALS * 3,
            totalIncome: 0,
            coolDown: block.timestamp
        });
        passives[msg.sender] = PassiveData({
            value: 10240 * TOKEN_DECIMALS,
            activeIncome: 0,
            lastDeposit: block.timestamp - SECONDS_IN_A_DAY,
            coolDown: block.timestamp - SECONDS_IN_A_DAY
        });        
        agents[msg.sender] = AgentData({
            parent: address(this),
            children: new address[](0),
            fees: rewardsAgent,
            totalIncome: 0,
            isActive: true
        });
        agentAccounts.push(msg.sender);

        regFee = 10 * TOKEN_DECIMALS;
        entryFee = 50 * TOKEN_DECIMALS;
        agentFee = 1000 * TOKEN_DECIMALS;

        withdrawalsPaused = false;
        poolThreshold = 5000;
        highestBalance = 0;
        cooldownEndTime = 0;
        cooldownPeriod = 0;

        maxRank = 9;
        maxCapped = 3;
        maxOverRide = 3;
        maxChildren = 100;
        maxCooldown = 1;
        maxTimeDelay = 30;
        maxIteration = 100;
        minWithdraw = 20 * TOKEN_DECIMALS;
        maxWithdraw = 200 * TOKEN_DECIMALS;

        rewardsReferral = 1000;
        rewardsOverRide = 500;
        rewardsPassiveMin = 100;
        rewardsPassiveMax = 300;
        rewardsAgent = 750;
        rewardsProjectFunds = 250;
        rewardsBufferFunds = 4000;
        rewardsDeduction = 0;

    }

    // ==================== USER FUNCTIONS ====================
    function register(address _referrer) external nonReentrant antiSpam {
        _validateRegistrationInputs(msg.sender, _referrer);
        require(usdtToken.balanceOf(address(msg.sender)) >= regFee, "Insufficient USDT balance");
        require(usdtToken.transferFrom(msg.sender, address(this), regFee), "Transfer failed");
        _registerUser(msg.sender, _referrer);
        userAccounts.push(msg.sender);
        _activateAccount(msg.sender, regFee);
        _poolGuard();
    }

    function depositUSDT(uint256 _amount) external nonReentrant antiSpam isRegisteredUser {
        require(usdtToken.balanceOf(address(msg.sender)) >= _amount, "Insufficient USDT balance");
        require(usdtToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        WalletData storage wallet = wallets[msg.sender];
        wallet.balance += _amount;
        wallet.coolDown = block.timestamp + 60 seconds;
    }

    function activateVIP() external nonReentrant antiSpam isRegisteredUser {
        AffiliateData memory affiliate = affiliates[msg.sender];
        uint256 upgradeAmount = calculateUpgradeAmount(affiliate.level);
        WalletData storage wallet = wallets[msg.sender];
        if (wallet.balance < upgradeAmount) revert InsufficientBalance();
        if (wallet.coolDown < block.timestamp) revert CooldownPeriodActive();
        wallet.balance -= upgradeAmount;
        _activateAccount(msg.sender, affiliate.level);
        _poolGuard();
    }

    function activateAgent() external nonReentrant antiSpam isRegisteredUser {
        AffiliateData storage affiliate = affiliates[msg.sender];
        AffiliateData storage affiliateParent = affiliates[affiliate.parent];

        if (agents[msg.sender].isActive) revert WalletExist();
        require(agentFee > 0, "Activation disabled");
        require(usdtToken.balanceOf(address(msg.sender)) >= agentFee, "Insufficient USDT balance");
        require(usdtToken.transferFrom(msg.sender, projectWallet, agentFee), "Transfer failed"); 
        agents[msg.sender] = AgentData({
            parent: affiliateParent.agent,
            children: new address[](0),
            fees: rewardsAgent,
            totalIncome: 0,
            isActive: true
        });
        agentAccounts.push(msg.sender);
        agents[affiliateParent.agent].children.push(msg.sender);
        affiliate.agent = msg.sender;
        _poolGuard();
        emit AgentActivated(msg.sender);
    }

    function collectPassive() external nonReentrant antiSpam isActiveUser {
        PassiveData storage passive = passives[msg.sender];
        WalletData storage wallet = wallets[msg.sender];
        uint256 passiveRewards = _calculatePassiveReward(msg.sender);
        if (block.timestamp < passive.coolDown + SECONDS_IN_A_DAY) revert CooldownPeriodActive();
        if (wallet.capping < passiveRewards) revert InsufficientBalance();
        wallet.balance += passiveRewards;
        wallet.capping -= passiveRewards;
        wallet.totalIncome += passiveRewards;
        passive.coolDown = block.timestamp;
        totalRewardsDistributed += passiveRewards;
        _poolGuard();
        emit InternalTransfer("passive", address(this), msg.sender, passiveRewards);
    }

    function withdraw(uint256 _amount) external nonReentrant antiSpam poolGuard isActiveUser {
        WalletData storage wallet = wallets[msg.sender];
        _poolGuard();

        //$20, $50, $100, $200
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
        emit InternalTransfer("withdraw", address(this), msg.sender, transferAmount);
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
    public view returns (uint256 balance, uint256 capping, uint256 totalIncome, uint256 coolDown) {
        WalletData storage wallet = wallets[_user];
        return (
            wallet.balance / TOKEN_DECIMALS,
            wallet.capping / TOKEN_DECIMALS,
            wallet.totalIncome / TOKEN_DECIMALS,
            wallet.coolDown
        );
    }

    function getLastCallTime(address _user) 
    public view returns (uint256) {
        return lastCallTime[_user];
    }    

    function getPassiveData(address _user)
    public view returns (uint256 value, uint256 activeIncome, uint256 lastDeposit, uint256 coolDown) {
        PassiveData storage passive = passives[_user];
        return (
            passive.value / TOKEN_DECIMALS,
            passive.activeIncome / TOKEN_DECIMALS,
            passive.lastDeposit,
            passive.coolDown
        );
    }    

    function getPassivePercent(address _user) 
    public view returns (uint256) {
        return _calculatePassivePct(_user);
    }

    function getPassiveReward(address _user) 
    public view returns (uint256) {
        return _calculatePassiveReward(_user) / TOKEN_DECIMALS ;
    }

    function getAvailableEquity(uint8 _currentLevel, uint256 _totalIncome) 
    public view returns (uint256) {
        return _calculateAvailableEquity(_currentLevel, _totalIncome) / TOKEN_DECIMALS;
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

    function calculateUpgradeAmount(uint8 _level)
    public pure returns (uint256) {
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
        require(_level < amounts.length, "Invalid level");
        return amounts[_level];
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
            capping: 0,
            totalIncome: 0,
            coolDown: block.timestamp
        });
        passives[_newUser] = PassiveData({
            value: 0,
            activeIncome: 0,
            lastDeposit: 0,
            coolDown: 0
        });
    }

    function _activateAccount(address _user, uint256 _amount)
    private {

        AffiliateData storage affiliate = affiliates[_user];
        WalletData storage wallet = wallets[_user];
        PassiveData storage passive = passives[_user];
        VaultData storage vault = vaults[_user][affiliate.level];
        
        // Batch updates
        affiliate.level += _amount==entryFee? 1 : 0;
        wallet.capping += _amount * maxCapped;
        passive.value += _amount;
        passive.lastDeposit = block.timestamp;
        passive.coolDown = block.timestamp;
        wallet.coolDown = block.timestamp;

        vault.amount = _amount;
        vault.coolDown = block.timestamp + 60 seconds;
        vault.cap += _amount*maxCapped;
    

        _distributeReferralRewards(_user, _amount);
        _distributeOverRideRewards(_user, _amount);
        _distributeMasterAgent(affiliate.agent, _amount);
        _distributeFundings(_amount);
        emit AccountActivated(_user, affiliate.level);
    }

    function _distributeMasterAgent(address _agent, uint256 _amount)
    private {
        AgentData storage agent = agents[_agent];
        AgentData storage agentParent = agents[agent.parent];
        
        address agentWallet = _agent;
        uint256 agentRewards = (_amount * agent.fees) / BASIS_POINTS;
        address masterWallet = agent.parent;
        uint256 masterRewards = (_amount * agentParent.fees) / BASIS_POINTS;
        if (usdtToken.balanceOf(address(this)) < (_amount * 750) / BASIS_POINTS) return;
        if ( agent.fees == 750  ){
            _safeTransfer(agentWallet, agentRewards);
            emit Rewards("AgentRewards", address(this), agentWallet, agentRewards);
        }else{
            _safeTransfer(agentWallet, agentRewards);
            emit Rewards("agentRewards", address(this), agentWallet, agentRewards);
            _safeTransfer(masterWallet, masterRewards);
            emit Rewards("agentRewards", address(this), masterWallet, masterRewards);
        }
    }

    function _distributeFundings( uint256 _amount)
    private {
        uint256 projectFunding = (_amount * rewardsProjectFunds) / BASIS_POINTS;
        if (usdtToken.balanceOf(address(this)) >= projectFunding) {
            _safeTransfer( projectWallet, projectFunding);
            totalProjectFunding += projectFunding;
        }
        uint256 bufferFunding = (_amount * rewardsBufferFunds) / BASIS_POINTS;
        if (usdtToken.balanceOf(address(this)) >= bufferFunding) {
            _safeTransfer( bufferWallet, bufferFunding);
            totalBufferFunding += bufferFunding;
        }        
    }

    function _distributeReferralRewards(address _user, uint256 _amount)
    private {
        address referrer = affiliates[_user].parent;
        if (referrer == address(0)) return;
        uint256 reward = (_amount * rewardsReferral) / BASIS_POINTS;
        WalletData storage referrerWallet = wallets[referrer];
        PassiveData storage referrerPassive = passives[referrer];
        if (referrerWallet.capping >= reward) {
            _safeTransfer( referrer, reward);
            referrerWallet.capping -= reward;
            referrerWallet.totalIncome += reward;
            referrerPassive.activeIncome += reward;
            totalRewardsDistributed += reward;
            emit Rewards("ReferralRewards", _user, referrer, reward);
        }
    }

    function _distributeOverRideRewards(address _user, uint256 _amount)
    private {
        AffiliateData storage affiliate = affiliates[_user];
        address currentParent = affiliate.parent;
        uint256 reward = (_amount * rewardsOverRide) / BASIS_POINTS;
        uint8 currentLevel = affiliate.level;
        uint8 rewardsGiven = 0;
        uint8 levelsTraversed = 0;
        if (currentLevel >= maxRank) return;
        while (currentParent != address(0) && rewardsGiven < maxOverRide && levelsTraversed < maxIteration) {
            AffiliateData storage parent = affiliates[currentParent];
            WalletData storage wallet = wallets[currentParent];
            PassiveData storage passive = passives[currentParent];
            (uint8 level, uint256 highestCap) = _getVaultMaxCap(_user);

            if (currentLevel < parent.level && highestCap >= reward) {
                wallet.balance += reward;
                wallet.capping -= reward;
                wallet.totalIncome += reward;
                totalRewardsDistributed += reward;
                rewardsGiven++;
                currentLevel = parent.level;

                vaults[currentParent][level].cap -= reward;

                emit Rewards("OverRideRewards", _user, currentParent, reward);
            }
            currentParent = parent.parent;
            levelsTraversed++;
        }
    }

    function _calculatePassiveReward(address _user)
    private view returns (uint256) {
        PassiveData memory passive = passives[_user];
        if (passive.lastDeposit == 0) return 0;
        uint256 passivePct = _calculatePassivePct(_user);
        uint256 maturedDays = (block.timestamp - passive.coolDown) / SECONDS_IN_A_DAY;
        uint256 availableEquity = _calculateAvailableEquity(affiliates[_user].level, wallets[_user].totalIncome);
        return (maturedDays * availableEquity * passivePct) / BASIS_POINTS;
    }

    function _calculatePassivePct(address _user)
    private view returns (uint256) {
        PassiveData memory passive = passives[_user];
        if (passive.lastDeposit == 0 || passive.value == 0) return 0;
        if (passive.activeIncome == 0) return rewardsPassiveMin;
        uint256 activePct = (passive.activeIncome * 1000) / passive.value;
        uint256 minPct = rewardsPassiveMin > activePct ? rewardsPassiveMin : activePct;
        return minPct < rewardsPassiveMax ? minPct : rewardsPassiveMax;
    }    

    function _calculateAvailableEquity(uint8 currentLevel, uint256 totalIncome)
    private view returns (uint256) {
        uint256 availableEquity = 0;
        uint256 passiveCapping = 0;
        uint256 levelEquity = 0;
        for (uint8 level = 0; level < currentLevel && level < maxRank; level++) {
            levelEquity = entryFee * (2 ** level);
            passiveCapping += levelEquity * maxCapped;
            if (totalIncome < passiveCapping ) {
               availableEquity += levelEquity;
            }
        }
        if (currentLevel >= maxRank && availableEquity == 0) {
            availableEquity = entryFee * (2 ** maxRank);
        }
        return availableEquity;
    } 

    function _validateRegistrationInputs(address _user, address _referrer)
    private view {
        if (_user == address(0)) revert InvalidAddress();
        if (_referrer == address(0)) revert InvalidAddress();
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
            highestBalance = currentBalance;
            withdrawalsPaused = false;
            cooldownEndTime = 0;
        }
        uint256 threshold = (highestBalance * poolThreshold) / BASIS_POINTS;
        if (currentBalance <= threshold && !withdrawalsPaused) {
            withdrawalsPaused = true;
            cooldownEndTime = block.timestamp + cooldownPeriod;
        }
        if (withdrawalsPaused && block.timestamp >= cooldownEndTime) {
            withdrawalsPaused = false;
            highestBalance = currentBalance;
        }
    }

    function _safeTransfer(address _user, uint256 _amount) internal {
        WalletData storage wallet = wallets[_user];
        if (block.timestamp <= wallet.coolDown + maxTimeDelay) {
            revert CooldownPeriodActive();
        }
        require(usdtToken.transfer(_user, _amount), "Transfer failed");
        wallet.coolDown = block.timestamp;
    }

    function _getVaultMaxCap(address _user) private view returns (uint8 level, uint256 highestCap) {
        for (uint8 i = 0; i < 9; i++) {
            VaultData storage v = vaults[_user][i];
            if (v.amount == 0) continue;
            if (v.cap > highestCap) {
                highestCap = v.cap;
                level = i;
            }
        }
    }

function _getVaultMinCap(address _user) private view returns (uint8 level, uint256 minCap) {
    bool initialized = false;

    for (uint8 i = 0; i < 9; i++) {
        uint256 cap = vaults[_user][i].cap;

        // Skip empty vaults (optional)
        if (cap == 0) continue;

        if (!initialized || cap < minCap) {
            minCap = cap;
            level = i;
            initialized = true;
        }
    }

    return (level, minCap);
}
    // ==================== ADMIN FUNCTIONS ====================
    function updateWalletData(
        address _user,
        uint256 _balance,
        uint256 _capping,
        uint256 _totalIncome,
        uint256 _coolDown) 
    external onlyOwner {
        require(wallets[_user].coolDown>0 , "Wallet Not Found");
        WalletData storage wallet = wallets[_user];
        if( _balance > 0 ) wallet.balance =  _balance;
        if( _capping > 0 ) wallet.capping =  _capping;
        if( _totalIncome > 0 ) wallet.totalIncome =  _totalIncome;
        if( _coolDown > 0 ) wallet.coolDown =  _coolDown;
    }

    function updatePassiveData(
        address _user,
        uint256 _value,
        uint256 _activeIncome,
        uint256 _lastDeposit,
        uint256 _coolDown)
    external onlyOwner {
        require(wallets[_user].coolDown>0 , "Wallet Not Found");
        PassiveData storage passive = passives[_user];
        if( _value > 0 ) passive.value =  _value;
        if( _activeIncome > 0 ) passive.activeIncome =  _activeIncome;
        if( _lastDeposit > 0 ) passive.lastDeposit =  _lastDeposit;
        if( _coolDown > 0 ) passive.coolDown =  _coolDown;
    }

    function updateAffiliateData(
        address _user,
        address _parent,
        address _agent,
        uint8 _level)
    external onlyOwner {
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
        AgentData storage agent = agents[_user];
        require(agent.parent != address(0), "Agent does not exist");

        if(_parent != address(0)) {
            agent.parent = _parent;
            _removedChild(_parent, _user, false);
            agents[_parent].children.push(_user);
        }
        if(_fees > 0) agent.fees = _fees;
        if(_totalIncome > 0) agent.totalIncome = _totalIncome;
        if(_isActive != agent.isActive) agent.isActive = _isActive;
    }
}