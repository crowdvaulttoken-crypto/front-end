export const smartContractAbi = [
  // -------------------- Constants / public getters --------------------
  "function maxRank() view returns (uint8)",
  "function maxCapped() view returns (uint8)",
  "function maxOverRide() view returns (uint8)",
  "function maxChildren() view returns (uint8)",
  "function maxCooldown() view returns (uint8)",
  "function maxIteration() view returns (uint8)",
  "function minWithdraw() view returns (uint256)",
  "function maxWithdraw() view returns (uint256)",

  "function regFee() view returns (uint256)",
  "function entryFee() view returns (uint256)",
  "function brokerFee() view returns (uint256)",

  "function rewardsReferral() view returns (uint256)",
  "function rewardsOverRide() view returns (uint256)",
  "function rewardsPassiveMin() view returns (uint256)",
  "function rewardsPassiveMax() view returns (uint256)",
  "function rewardsBroker() view returns (uint256)",
  "function rewardsTradePool() view returns (uint256)",
  "function rewardsDeduction() view returns (uint256)",

  "function totalDeposits() view returns (uint256)",
  "function totalRewardsDistributed() view returns (uint256)",
  "function totalWithdrawals() view returns (uint256)",
  "function totalTradePool() view returns (uint256)",

  // arrays (auto getters)
  "function userAccounts(uint256) view returns (address)",
  "function brokerAccounts(uint256) view returns (address)",

  // last call tracking
  "function lastCallBlock(address) view returns (uint256)",
  "function lastCallTime(address) view returns (uint256)",

  // -------------------- User functions --------------------
  "function register(address _referrer) external",
  "function activateWithDeposit() external",
  "function activateWithWallet() external",
  "function activateBroker() external",
  "function collectPassive() external",
  "function withdraw(uint256 _amount) external",

  // -------------------- Read / view helpers --------------------
  "function brokers(address _user) view returns (address parent, uint256 fees, uint256 totalIncome, bool isActive)",
  "function affiliates(address _user) view returns (address parent, address broker, uint8 level)",
  "function wallets(address _user) view returns (uint256 balance, uint256 capping, uint256 totalIncome, uint256 coolDown)",
  "function getLastCallTime(address _user) view returns (uint256)",
  "function getAffiliateData(address _user) view returns (address parent, address broker, uint8 level, uint256 childrenCount)",
  "function getBrokerData(address _user) view returns (address parent, uint256 fees, uint256 totalIncome, bool isActive, uint256 childrenCount)",
  "function getChildren(bool _isAffiliate, address _user, uint256 _startIndex, uint256 _count) view returns (address[] childrenBatch)",
  "function getWalletData(address _user) view returns (uint256 balance, uint256 capping, uint256 totalIncome, uint256 coolDown)",
  "function getPassiveData(address _user) view returns (uint256 value, uint256 activeIncome, uint256 lastDeposit, uint256 coolDown)",
  "function getPassiveReward(address _user) view returns (uint256)",
  "function getPassivePercent(address _user) view returns (uint256)",
  "function getAvailableEquity(uint8 _currentLevel, uint256 _totalIncome) view returns (uint256)",
  "function getContractStats() view returns (uint256 totalUsers, uint256 totalBrokers, uint256 contractBalance, uint256 _totalDeposits, uint256 _totalRewardsDistributed, uint256 _totalWithdrawals)",
  "function getPoolGuardData() view returns (uint256 _poolThreshold, uint256 _highestBalance, uint256 _cooldownEndTime, bool _withdrawalsPaused)",
  "function calculateUpgradeAmount(address _user) view returns (uint256)",

  // -------------------- Admin / mutative functions --------------------
  "function updateModifiers(address _newDevOps, address _newAssetManager, address _newArbitrageWallet) external",
  "function updateRewardsToken(address _newToken) external",
  "function updateFees(uint256 _newRegFee, uint256 _newEntryFee, uint256 _newBrokerFee) external",
  // updateSafetyParameters includes rewardsDeduction in this contract version
  "function updateSafetyParameters(uint8 _newMaxRank, uint8 _newMaxCapped, uint8 _newMaxOverRide, uint8 _newMaxChildren, uint8 _newMaxCooldown, uint8 _newMaxIteration, uint256 _newMaxWithdraw, uint256 _newMinWithdraw, uint256 _newRewardsDeduction) external",
  "function updateRewardRates(uint256 _newRewardsReferral, uint256 _newRewardsOverRide, uint256 _newRewardsPassiveMin, uint256 _newRewardsPassiveMax, uint256 _newRewardsBroker, uint256 _newRewardsTradePool, uint256 _newRewardsDeduction) external",

  "function updateWalletData(address _user, uint256 _balance, uint256 _capping, uint256 _totalIncome, uint256 _coolDown) external",
  "function updatePassiveData(address _user, uint256 _value, uint256 _activeIncome, uint256 _lastDeposit, uint256 _coolDown) external",
  "function updateAffiliateData(address _user, address _parent, address _broker, uint8 _level) external",
  // updateBrokerData in this contract includes totalIncome parameter
  "function updateBrokerData(address _user, address _parent, uint256 _fees, uint256 _totalIncome, bool _isActive) external",
  "function updatePoolGuardData(uint256 _newPoolThreshold, uint256 _newHighestBalance, uint256 _newCooldownEndTime, uint256 _newCooldownPeriod, bool _withdrawalsPaused) external",

  // -------------------- Events --------------------
  "event InternalTransfer(string method, address indexed from, address indexed to, uint256 amount)",
  "event AffiliateUpdated(address indexed user, address indexed affiliate)",
  "event SettingsUpdated(string settingName, uint256 newValue)",
  "event BrokerActivated(address indexed broker)",
  "event AccountActivated(address indexed user, uint8 newLevel)",
  "event Rewards(string rewardsName, address indexed from, address indexed to, uint256 newValue)"
];