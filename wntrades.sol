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

contract WNTRADES is ReentrancyGuard {

    // ==================== CONSTANTS ====================
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_IN_A_DAY = 86400;
    uint256 private constant TOKEN_DECIMALS = 1e18;

    // ==================== STATE VARIABLES ====================
    IERC20 private usdtToken;
    address private devOps;
    address private assetManager;
    address private arbitrageWallet;

    // PoolGuard Trigger On Off
    bool private withdrawalsPaused;
    uint256 private poolThreshold;
    uint256 private highestBalance;
    uint256 private cooldownEndTime;
    uint256 private cooldownPeriod;

    // Default Safety Parameters
    uint8 public maxRank = 9;
    uint8 public maxCapped = 3;
    uint8 public maxOverRide = 3;
    uint8 public maxChildren = 100;
    uint8 public maxCooldown = 1;
    uint8 public maxTimeDelay = 60;
    uint8 public maxIteration = 100;
    uint256 public minWithdraw = 10 * TOKEN_DECIMALS;
    uint256 public maxWithdraw = 100 * TOKEN_DECIMALS;

    // Default Fee Structure
    uint256 public regFee = 0 * TOKEN_DECIMALS;
    uint256 public entryFee = 10 * TOKEN_DECIMALS;
    uint256 public brokerFee = 1000 * TOKEN_DECIMALS;

    // Default Reward Rates (in basis points)
    uint256 public rewardsReferral = 1000;
    uint256 public rewardsOverRide = 1000;
    uint256 public rewardsPassiveMin = 100;
    uint256 public rewardsPassiveMax = 300;
    uint256 public rewardsBroker = 500;
    uint256 public rewardsTradePool = 1000;
    uint256 public rewardsDeduction = 0;
    
    // Statistics
    uint256 public totalDeposits;
    uint256 public totalRewardsDistributed;
    uint256 public totalWithdrawals;
    uint256 public totalTradePool;
 
    // Structs
    struct AffiliateData {
        address parent;
        address[] children;
        address broker;
        uint8 level;
    }
    
    struct WalletData {
        uint256 balance;
        uint256 capping;
        uint256 totalIncome;
        uint256 coolDown;
    }

    struct BrokerData {
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

    // Mappings
    mapping(address => AffiliateData) public affiliates;
    mapping(address => WalletData) public wallets;
    mapping(address => BrokerData) public brokers;
    mapping(address => PassiveData) public passives;
    mapping(address => uint256) private lastCallBlock;
    mapping(address => uint256) private lastCallTime;

    // Accounts
    address[] public userAccounts;
    address[] public brokerAccounts;

    // ==================== EVENTS ====================
    event InternalTransfer(string method, address indexed from, address indexed to, uint256 amount);
    event AffiliateUpdated(address indexed user, address indexed affiliate);
    event SettingsUpdated(string settingName, uint256 newValue);
    event BrokerActivated(address indexed broker);
    event AccountActivated(address indexed user, uint8 newLevel);
    event Rewards(string rewardsName, address indexed from, address indexed to, uint256 newValue);

    // ==================== MODIFIERS ====================
    modifier onlyAssetManager() {
        require(msg.sender == assetManager, "Unauthorized: Asset manager only");
        _;
    }

    modifier onlyDevOps() {
        require(msg.sender == devOps, "Unauthorized: DevOps only");
        _;
    }    

    modifier isActiveUser() {
        require(wallets[msg.sender].capping > 0, "Inactive user");
        _;
    }

    modifier isRegisteredUser() {
        require(affiliates[msg.sender].parent != address(0), "Unregistered user");
        _;
    }

    modifier isActiveBroker() {
        require(brokers[msg.sender].isActive, "Inactive broker");
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
        devOps = msg.sender;
        assetManager = msg.sender;
        arbitrageWallet = msg.sender;
        affiliates[msg.sender] = AffiliateData({
            parent: address(this),
            children: new address[](0),
            broker: msg.sender,
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
        brokers[msg.sender] = BrokerData({
            parent: address(this),
            children: new address[](0),
            fees: rewardsBroker,
            totalIncome: 0,
            isActive: true
        });
        brokerAccounts.push(msg.sender);
    }

    // ==================== USER FUNCTIONS ====================
    function register(address _referrer) external nonReentrant antiSpam {
        _validateRegistrationInputs(msg.sender, _referrer);
        require(usdtToken.balanceOf(address(msg.sender)) >= entryFee, "Insufficient USDT balance");
        if (regFee > 0 ) {
            require(usdtToken.transferFrom(msg.sender, assetManager, regFee), "Transfer failed");
        }
        _registerUser(msg.sender, _referrer);
        userAccounts.push(msg.sender);
    }

    function activateWithDeposit() external nonReentrant antiSpam isRegisteredUser {
        uint256 upgradeAmount = calculateUpgradeAmount(msg.sender);
        require(usdtToken.balanceOf(address(msg.sender)) >= entryFee, "Insufficient USDT balance");
        require(usdtToken.transferFrom(msg.sender, address(this), upgradeAmount), "Transfer failed");
        totalDeposits += upgradeAmount;
        _activateAccount(msg.sender, upgradeAmount);
        _poolGuard();
    }

    function activateWithWallet() external nonReentrant antiSpam isRegisteredUser {
        uint256 upgradeAmount = calculateUpgradeAmount(msg.sender);
        WalletData storage wallet = wallets[msg.sender];
        if (wallet.balance < upgradeAmount) revert InsufficientBalance();
        wallet.balance -= upgradeAmount;
        _activateAccount(msg.sender, upgradeAmount);
        _poolGuard();
    }

    function activateBroker() external nonReentrant antiSpam isRegisteredUser {
        AffiliateData storage affiliate = affiliates[msg.sender];
        AffiliateData storage affiliateParent = affiliates[affiliate.parent];

        if (brokers[msg.sender].isActive) revert WalletExist();
        require(brokerFee > 0, "Activation disabled");
        require(usdtToken.balanceOf(address(msg.sender)) >= brokerFee, "Insufficient USDT balance");
        require(usdtToken.transferFrom(msg.sender, arbitrageWallet, brokerFee), "Transfer failed"); 
        brokers[msg.sender] = BrokerData({
            parent: affiliateParent.broker,
            children: new address[](0),
            fees: rewardsBroker,
            totalIncome: 0,
            isActive: true
        });
        brokerAccounts.push(msg.sender);
        brokers[affiliateParent.broker].children.push(msg.sender);
        affiliate.broker = msg.sender;
        _poolGuard();
        emit BrokerActivated(msg.sender);
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
        if (_amount < minWithdraw) revert WithdrawalLimit();
        if (_amount > maxWithdraw) revert WithdrawalLimit();
        if (wallet.balance < _amount) revert InsufficientBalance();
        if (usdtToken.balanceOf(address(this)) < _amount) revert InsufficientBalance();
        uint256 transferAmount = rewardsDeduction == 0 ? _amount : (_amount * (BASIS_POINTS - rewardsDeduction)) / BASIS_POINTS;
        uint256 coolDown = (block.timestamp - wallet.coolDown) / SECONDS_IN_A_DAY;
        if (coolDown < maxCooldown) revert CooldownPeriodActive();
        require(usdtToken.transfer(msg.sender, transferAmount), "Transfer failed");
        wallet.balance -= _amount;
        wallet.coolDown = block.timestamp;
        totalWithdrawals += _amount;
        emit InternalTransfer("withdraw", address(this), msg.sender, _amount);
    }

    // ==================== VIEW FUNCTIONS ====================
    function getAffiliateData(address _user) 
    public view returns ( address parent, address broker, uint8 level, uint256 childrenCount){
        AffiliateData storage affiliate = affiliates[_user];
        return (
            affiliate.parent,
            affiliate.broker,
            affiliate.level,
            affiliate.children.length
        );
    }

    function getBrokerData(address _user) 
    public view returns (address parent, uint256 fees, uint256 totalIncome, bool isActive, uint256 childrenCount) {
        require(brokers[_user].parent != address(0), "Broker does not exist");
        BrokerData storage broker = brokers[_user];
        return (
            broker.parent,
            broker.fees,
            broker.totalIncome / TOKEN_DECIMALS,
            broker.isActive,
            broker.children.length
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
            : brokers[_user].children;
        
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
        return lastCallTime[_user] == 0 ? block.timestamp : lastCallTime[_user];
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
        uint256 totalBrokers,
        uint256 contractBalance,
        uint256 _totalDeposits,
        uint256 _totalRewardsDistributed,
        uint256 _totalWithdrawals
    ) {
        return (
            userAccounts.length,
            brokerAccounts.length,
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

    function calculateUpgradeAmount(address _user) 
    public view returns (uint256) {
        uint8 currentLevel = affiliates[_user].level < maxRank ? affiliates[_user].level : maxRank;
        return entryFee * (2 ** currentLevel);
    }

    // ==================== PRIVATE FUNCTIONS ====================
    function _registerUser(address _newUser, address _referrer)
    private {
        AffiliateData memory affiliate = affiliates[_referrer];
        affiliates[_newUser] = AffiliateData({
            parent: _referrer,
            children: new address[](0),
            broker: affiliate.broker,
            level: 0
        });
        affiliates[_referrer].children.push(_newUser);
        brokers[affiliate.broker].children.push(_newUser);
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
        
        // Batch updates
        affiliate.level += 1;
        wallet.capping += _amount * maxCapped;
        passive.value += _amount;
        passive.lastDeposit = block.timestamp;
        passive.coolDown = block.timestamp;
        wallet.coolDown = block.timestamp;

        _distributeReferralRewards(_user, _amount);
        _distributeOverRideRewards(_user, _amount);
        _distributeBrokersRewards(_user, affiliate.broker, _amount);
        _distributeTradePool(_amount);
        emit AccountActivated(_user, affiliate.level);
    }

    function _distributeBrokersRewards(address _user, address _broker, uint256 _amount)
    private {
        BrokerData storage broker = brokers[_broker];
        if (!broker.isActive || broker.fees == 0 ) return;
        uint256 brokerRewards = (_amount * broker.fees) / BASIS_POINTS;
        address brokerWallet = _user == _broker ? broker.parent : _broker;
        if (usdtToken.balanceOf(address(this)) >= brokerRewards ) {
            require(usdtToken.transfer(brokerWallet, brokerRewards), "Transfer failed");
            broker.totalIncome += brokerRewards;
            emit Rewards("BrokerRewards", address(this), brokerWallet, brokerRewards);
        }
    }

    function _distributeTradePool( uint256 _amount)
    private {
        uint256 tradePool = (_amount * rewardsTradePool) / BASIS_POINTS;
        if (usdtToken.balanceOf(address(this)) >= tradePool) {
            require(usdtToken.transfer(arbitrageWallet, tradePool), "Transfer failed");
            totalTradePool += tradePool;
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
            referrerWallet.balance += reward;
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

            if (currentLevel < parent.level && wallet.capping >= reward) {
                wallet.balance += reward;
                wallet.capping -= reward;
                wallet.totalIncome += reward;
                passive.activeIncome += reward;
                totalRewardsDistributed += reward;
                rewardsGiven++;
                currentLevel = parent.level;
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
        address[] storage children = isAffiliates ? affiliates[_parent].children : brokers[_parent].children;
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
        }
    }

    // ==================== ADMIN FUNCTIONS ====================
    function updateModifiers(
        address _newDevOps,
        address _newAssetManager,
        address _newArbitrageWallet) 
    external onlyDevOps {
        if( _newDevOps!=address(0) && _newDevOps.code.length == 0 ) {
            devOps = _newDevOps;
        }
        if( _newAssetManager!=address(0) && _newDevOps.code.length == 0 ) {
            assetManager = _newAssetManager;
        }
        if( _newArbitrageWallet!=address(0) ) {
            arbitrageWallet = _newArbitrageWallet;
        }
    }  

    function updateRewardsToken(address _newToken) 
    external onlyAssetManager {
        require(_newToken != address(0), "Invalid token address");
        usdtToken = IERC20(_newToken);
    }     

    function updateFees(
        uint256 _newRegFee,
        uint256 _newEntryFee,
        uint256 _newBrokerFee
    ) external onlyAssetManager {
        if (_newRegFee > 0) {
            regFee = _newRegFee;
            emit SettingsUpdated("regFee", _newRegFee);
        }
        if (_newEntryFee > 0) {
            entryFee = _newEntryFee;
            emit SettingsUpdated("entryFee", _newEntryFee);
        }
        if (_newBrokerFee >= 0) {
            brokerFee = _newBrokerFee;
            emit SettingsUpdated("brokerFee", _newBrokerFee);
        }
    }

    function updateSafetyParameters(
        uint8 _newMaxRank,
        uint8 _newMaxCapped,
        uint8 _newMaxOverRide,
        uint8 _newMaxChildren,
        uint8 _newMaxCooldown,
        uint8 _newMaxTimeDelay,
        uint8 _newMaxIteration,
        uint256 _newMaxWithdraw,
        uint256 _newMinWithdraw,
        uint256 _newRewardsDeduction
        ) 
    external onlyAssetManager {
        if( _newMaxRank>0 ) {
            maxRank = _newMaxRank;
            emit SettingsUpdated("maxRank", _newMaxRank);
        }
        if( _newMaxCapped>0 ) {
            maxCapped = _newMaxCapped;
            emit SettingsUpdated("maxCapped", _newMaxCapped);
        }    
        if( _newMaxOverRide>0 ) {
            maxOverRide = _newMaxOverRide;
            emit SettingsUpdated("maxOverRide", _newMaxOverRide);
        }
        if( _newMaxChildren>0 ) {
            maxChildren = _newMaxChildren;
            emit SettingsUpdated("maxChildren", _newMaxChildren);
        }
        if( _newMaxTimeDelay>0 ) {
            maxTimeDelay = _newMaxTimeDelay;
            emit SettingsUpdated("maxTimeDelay", _newMaxTimeDelay);
        } 
        if( _newMaxCooldown>0 ) {
            maxCooldown = _newMaxCooldown;
            emit SettingsUpdated("maxCooldown", _newMaxCooldown);
        }
        if( _newMaxIteration>0 ) {
            maxIteration = _newMaxIteration;
            emit SettingsUpdated("maxIteration", _newMaxIteration);
        }
        if( _newMaxWithdraw>0 ) {
            maxWithdraw = _newMaxWithdraw;
            emit SettingsUpdated("maxWithdraw", _newMaxWithdraw);
        } 
        if( _newMinWithdraw>0 ) {
            minWithdraw = _newMinWithdraw;
            emit SettingsUpdated("minWithdraw", _newMinWithdraw);
        }       
        if( _newRewardsDeduction>=0 ) {
            require(_newRewardsDeduction <= BASIS_POINTS, "Invalid rewardsDeduction");
            rewardsDeduction = _newRewardsDeduction;
            emit SettingsUpdated("rewardsDeduction", _newRewardsDeduction);
        }        
    }

    function updateRewardRates(
        uint256 _newRewardsReferral,
        uint256 _newRewardsOverRide,
        uint256 _newRewardsPassiveMin,
        uint256 _newRewardsPassiveMax,
        uint256 _newRewardsBroker,
        uint256 _newRewardsTradePool,
        uint256 _newRewardsDeduction
        ) 
    external onlyAssetManager {
        if( _newRewardsReferral>0 ) {
            rewardsReferral = _newRewardsReferral;
            emit SettingsUpdated("rewardsReferral", _newRewardsReferral);
        }
        if( _newRewardsOverRide>0 ) {
            rewardsOverRide = _newRewardsOverRide;
            emit SettingsUpdated("rewardsOverRide", _newRewardsOverRide);
        }
        if( _newRewardsPassiveMin>0 ) {
            rewardsPassiveMin = _newRewardsPassiveMin;
            emit SettingsUpdated("rewardsPassiveMin", _newRewardsPassiveMin);
        }
        if( _newRewardsPassiveMax>0 ) {
            rewardsPassiveMax = _newRewardsPassiveMax;
            emit SettingsUpdated("rewardsPassiveMax", _newRewardsPassiveMax);
        }        
        if( _newRewardsBroker>0 ) {
            rewardsBroker = _newRewardsBroker;
            emit SettingsUpdated("rewardsBroker", _newRewardsBroker);
        }        
        if( _newRewardsTradePool>0 ) {
            rewardsTradePool = _newRewardsTradePool;
            emit SettingsUpdated("rewardsTradePool", _newRewardsTradePool);
        }
        if( _newRewardsDeduction>0 ) {
            rewardsDeduction = _newRewardsDeduction;
            emit SettingsUpdated("rewardsDeduction", _newRewardsDeduction);
        }           
    }

    function updateWalletData(
        address _user,
        uint256 _balance,
        uint256 _capping,
        uint256 _totalIncome,
        uint256 _coolDown) 
    external onlyAssetManager {
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
    external onlyAssetManager {
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
        address _broker,
        uint8 _level)
    external onlyAssetManager {
        AffiliateData storage affiliate = affiliates[_user];
        if( _level > 0 ) affiliate.level =  _level;
        if( _parent != address(0) ){
            address oldParent = affiliate.parent;
            _removedChild(oldParent,_user, true );
            affiliate.parent =  _parent;
            AffiliateData storage parent = affiliates[_parent];
            parent.children.push(_user);
        }
        if( _broker != address(0) ){
            address oldBroker = affiliate.broker;
            _removedChild(oldBroker,_user, false );
            affiliate.broker =  _broker;
            BrokerData storage broker = brokers[_broker];
            broker.children.push(_user);
        }
    }

    function updateBrokerData(
        address _user,
        address _parent,
        uint256 _fees,
        uint256 _totalIncome,
        bool _isActive)
    external onlyAssetManager {
        require(brokers[_user].parent != address(0), "Broker does not exist");
        BrokerData storage broker = brokers[_user];
        if(_parent != address(0)) {
            require(brokers[_parent].isActive, "Parent not active");
            broker.parent = _parent;
            _removedChild(_parent, _user, false);
            brokers[_parent].children.push(_user);
        }
        if(_fees > 0) broker.fees = _fees;
        if(_totalIncome > 0) broker.totalIncome = _totalIncome;
        if(_isActive != broker.isActive) broker.isActive = _isActive;
    }

    function updatePoolGuardData(
        uint256 _newPoolThreshold,
        uint256 _newHighestBalance,
        uint256 _newCooldownEndTime,
        uint256 _newCooldownPeriod,
        bool _withdrawalsPaused
        )
    external onlyAssetManager {
        if(_newPoolThreshold > 0) poolThreshold = _newPoolThreshold;
        if(_newHighestBalance > 0) highestBalance = _newHighestBalance;
        if(_newCooldownEndTime > 0) cooldownEndTime = _newCooldownEndTime;
        if(_newCooldownPeriod > 0) cooldownPeriod = _newCooldownPeriod;
        if(_withdrawalsPaused != withdrawalsPaused) withdrawalsPaused = _withdrawalsPaused;
    }
}