// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PapparicoToken.sol";
import "./PapparicoTreasury.sol";
import "./PapparicoFrequentPlayerPoints.sol";
import "./IPapparicoPayable.sol";
import "./lib/PayableUtils.sol";
import "./lib/DateUtils.sol";

contract PapparicoVaults is AccessControl, ReentrancyGuard, IPapparicoPayable {

  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  bytes32 constant OPERATOR = keccak256("OPERATOR");

  uint256 constant DIGITS = 1e18;
  uint256 constant PRECISION = 1e27;
  uint256 constant EMISSION = 6e1;
  uint256 constant EMISSION_PRECISION = 6e5;
  uint256 constant HPERC = 1e4;

  enum VType {
    V_1M,
    V_6M,
    V_12M,
    V_24M,
    V_48M
  }

  struct UserDeposit {
    VType vType;
    uint256 depositId;
    uint256 depositedValue;
    uint256 lockedUntil;
    bool isUnlocked;
  }

  mapping(VType => uint256) public currentRewardsPerToken;
  mapping(VType => uint256) public lastsUpdateTime;
  uint256 public avgBlockInterval;
  uint256 public rewardEmissionPerBlock;

  uint256 public earlyWithdrawalPoints;
  uint256 public earlyWithdrawalPerc;

  bool public isInitialized;
  uint256 public startBlock;

  uint256 public idCounter;
  address[] public users;
  mapping(address => uint256) public userIds;
  mapping(address => mapping(VType => UserDeposit[])) public userDeposits;

  uint256 public totalDepositedAllUsers;
  mapping(VType => uint256) public totalDepositedPerVault;

  mapping(address => mapping(VType => uint256)) public userCurrentRewards;
  mapping(address => mapping(VType => uint256)) public userRewardsPerTokenPaid;
  mapping(address => uint256) public userTotalClaimed;
  uint256 public totalClaimed;

  PapparicoToken private immutable papparicoToken;
  PapparicoTreasury private immutable papparicoTreasury;
  PapparicoFrequentPlayerPoints private immutable frequentPoints;

  constructor(PapparicoToken _papparicoToken, PapparicoTreasury _papparicoTreasury,
    PapparicoFrequentPlayerPoints _frequentPoints) {

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(OPERATOR, msg.sender);

    papparicoToken = _papparicoToken;
    papparicoTreasury = _papparicoTreasury;
    frequentPoints = _frequentPoints;
    avgBlockInterval = 6 seconds;
  }

  function initialize(uint256 _startBlock, uint256 _rewardEmissionPerBlock) external onlyOperator() 
    validateInitialize(_startBlock, _rewardEmissionPerBlock) {

    isInitialized = true;

    uint256 currentTime = block.timestamp;
    uint256 currentBlock = block.number;

    startBlock = _startBlock;

    uint256 lastTime = (_startBlock - currentBlock).mul(avgBlockInterval).add(currentTime);
    for (uint8 i; i <= 4; ++i) {
      lastsUpdateTime[VType(i)] = lastTime;
    }

    rewardEmissionPerBlock = _rewardEmissionPerBlock;

    emit Initialized(currentTime);
  }

  function deposit(uint256 _amount, VType _vType) external nonReentrant 
    validateDeposit(_amount, _vType)
    updateUserReward(msg.sender, _vType) {

    _claim();

    totalDepositedAllUsers = totalDepositedAllUsers.add(_amount);
    totalDepositedPerVault[_vType] = totalDepositedPerVault[_vType].add(_amount);

    uint256 depId = block.timestamp;
    _addDeposit(_vType, depId, _amount, calculateLockedUntil(depId, _vType));

    if (userIds[msg.sender] == 0) {
      ++idCounter;
      userIds[msg.sender] = idCounter;
      users.push(msg.sender);
      frequentPoints.addPoints(msg.sender, calculateFrequentPlayerPoints(_vType));
    }

    IERC20(papparicoToken).safeTransferFrom(msg.sender, address(this), _amount);
    emit Deposited(msg.sender, depId, _amount, uint256(_vType), block.timestamp);
  }

  function withdraw(VType _vType, uint256 _depId) external nonReentrant 
    validateWithdrawal(_vType, _depId)
    updateUserReward(msg.sender, _vType) {

    _claim();

    uint256 depositedValue = getDepositedValue(_vType, _depId);
    _withdraw(_vType, _depId, depositedValue);

    IERC20(papparicoToken).safeTransfer(msg.sender, depositedValue);
    emit Withdrawn(msg.sender, _depId, depositedValue, uint256(_vType), block.timestamp);
  }

  function earlyWithdraw(VType _vType, uint256 _depId) external nonReentrant 
    validateEarlyWithdrawal(_vType, _depId)
    updateUserReward(msg.sender, _vType) {

    _claim();

    uint256 depositedValue = getDepositedValue(_vType, _depId);
    uint256 early = depositedValue.mul(earlyWithdrawalPerc).div(HPERC);

    _withdraw(_vType, _depId, early);
    frequentPoints.usePoints(msg.sender, earlyWithdrawalPoints);

    uint256 locked = calculateLockedUntil(_depId, _vType);
    _addDeposit(_vType, _depId, depositedValue.sub(early), locked);

    IERC20(papparicoToken).safeTransfer(msg.sender, early);
    emit Withdrawn(msg.sender, _depId, early, uint256(_vType), block.timestamp);
  }

  function upgrade(VType _sourceVType, uint256 _depId, VType _targetVType) external nonReentrant
    validateUpgrade(_sourceVType, _depId, _targetVType) 
    updateUserReward(msg.sender, _sourceVType)
    updateUserReward(msg.sender, _targetVType) {

    _claim();

    uint256 depositedValue = getDepositedValue(_sourceVType, _depId);
    totalDepositedPerVault[_sourceVType] = totalDepositedPerVault[_sourceVType].sub(depositedValue);
    totalDepositedPerVault[_targetVType] = totalDepositedPerVault[_targetVType].add(depositedValue);
    removeDeposit(_sourceVType, _depId);

    uint256 depId = block.timestamp;
    uint256 locked = calculateLockedUntil(depId, _targetVType);
    _addDeposit(_targetVType, depId, depositedValue, locked);

    emit Upgraded(msg.sender, _depId, depId, uint256(_targetVType), block.timestamp);
  }

  function claim() public nonReentrant {
    _claim();
  }

  function _addDeposit(VType _vType, uint256 _depId, uint256 _depValue, uint256 _lockedUntil) private {
    UserDeposit memory userDeposit = UserDeposit({
      vType: _vType,
      depositId: _depId,
      depositedValue: _depValue,
      lockedUntil: _lockedUntil,
      isUnlocked: false
    });
    userDeposits[msg.sender][_vType].push(userDeposit);
  }

  function _withdraw(VType _vType, uint256 _depId, uint256 _amount) private {
    totalDepositedAllUsers = totalDepositedAllUsers.sub(_amount);
    totalDepositedPerVault[_vType] = totalDepositedPerVault[_vType].sub(_amount);
    removeDeposit(_vType, _depId);
  }

  function _claim() private updateUserRewardWhenClaim(msg.sender) {
    uint256 rewards;
    address user = msg.sender;
    for (uint8 i; i <= 4; ++i) {
      if (isDepV(user, VType(i))) {
        rewards = rewards.add(userCurrentRewards[user][VType(i)]);
        userCurrentRewards[user][VType(i)] = 0;
      }
    }
    if (rewards > 0) {
      userTotalClaimed[msg.sender] = userTotalClaimed[msg.sender].add(rewards);
      totalClaimed = totalClaimed.add(rewards);
      IERC20(papparicoToken).safeTransfer(user, rewards);
      emit Claimed(user, rewards, block.timestamp);
    }
  }

  function depositsOf(address _user, VType _vType) external view returns (UserDeposit[] memory) {
    UserDeposit[] memory deposits = userDeposits[_user][_vType];
    for (uint256 i; i < userDeposits[_user][_vType].length; ++i) {
      deposits[i].isUnlocked = userDeposits[_user][_vType][i].lockedUntil < block.timestamp;
    }
    return deposits;
  }

  function getDepositedValue(VType _vType, uint256 _depId) private view returns (uint256) {
    ( , , , uint256 value, ) = depositExists(msg.sender, _vType, _depId);
    return value;
  }

  function depositExists(address _user, VType _vType, uint256 _depId) private view returns (bool, uint256, uint256, uint256, uint256) {
    uint256 length = userDeposits[_user][_vType].length;
    for (uint256 pos; pos < length; ++pos) {
      if (userDeposits[_user][_vType][pos].depositId == _depId) {
        return (
          true,
          pos,
          userDeposits[_user][_vType][pos].depositId,
          userDeposits[_user][_vType][pos].depositedValue,
          userDeposits[_user][_vType][pos].lockedUntil
        );
      }
    }
    return (false, 0, 0, 0, 0);
  }

  function getDepositArrayPosition(VType _vType, uint256 _depId) private view returns (uint256) {
    ( , uint256 pos, , , ) = depositExists(msg.sender, _vType, _depId);
    return pos;
  }

  function removeDeposit(VType _vType, uint256 _depId) private {
    uint256 length = userDeposits[msg.sender][_vType].length;
    uint256 position = getDepositArrayPosition(_vType, _depId);
    userDeposits[msg.sender][_vType][position] = userDeposits[msg.sender][_vType][length - 1];
    userDeposits[msg.sender][_vType].pop();
  }

  function isEmissionsStarted() public view returns (bool) {
    return isInitialized && block.number >= startBlock;
  }

  function calculateFrequentPlayerPoints(VType _vType) private pure returns (uint256) {
    uint16 points = 
      (_vType == VType.V_1M ? 1 : 
        (_vType == VType.V_6M ? 2 : 
          (_vType == VType.V_12M ? 3 : 
            (_vType == VType.V_24M ? 4 : 5))));

    return points;
  }

  function calculateLockedUntil(uint256 currentTime, VType _vType) public pure returns (uint256) {
    uint16 months = 
      (_vType == VType.V_1M ? 1 : 
        (_vType == VType.V_6M ? 6 : 
          (_vType == VType.V_12M ? 12 : 
            (_vType == VType.V_24M ? 24 : 48))));

    return DateUtils.addMonths(currentTime, months);
  }

  function calculateLockedUntil(VType _vType) public view returns (uint256) {
    return calculateLockedUntil(block.timestamp, _vType);
  }

  function calculateRewardRate(VType _vType) private view returns (uint256) {
    return rewardEmissionPerBlock.mul(getMultiplier(_vType)).mul(EMISSION).div(avgBlockInterval);
  }

  function getMultiplier(VType _vType) private pure returns (uint8) {
    return 
      (_vType == VType.V_1M ? 2 : 
        (_vType == VType.V_6M ? 12 : 
          (_vType == VType.V_12M ? 24 : 
            (_vType == VType.V_24M ? 48 : 96))));
  }

  function calculateRewardPerToken(VType _vType) private view returns (uint256) {
    if (!isEmissionsStarted()) {
      return 0;
    }
    if (totalDepositedAllUsers == 0 || totalDepositedPerVault[_vType] == 0) {
      return currentRewardsPerToken[_vType];
    }
    return currentRewardsPerToken[_vType].add((block.timestamp - lastsUpdateTime[_vType])
      .mul(calculateRewardRate(_vType)).mul(PRECISION).div(EMISSION_PRECISION).div(totalDepositedPerVault[_vType]));
  }

  function sumUserDeposits(address _user, VType _vType) private view returns (uint256) {
    uint256 sum = 0;
    uint256 length = userDeposits[_user][_vType].length;
    if (length == 0) {
      return sum;
    }
    for (uint256 i; i < length; ++i) {
      sum = sum.add(userDeposits[_user][_vType][i].depositedValue);
    }
    return sum;
  }

  function rewardsOf(address _user, VType _vType) private view returns (uint256) {
    uint256 userRewards = 0;
    if (!isEmissionsStarted()) {
      return userRewards;
    }
    userRewards = userRewards.add
    (
      sumUserDeposits(_user, _vType)
        .mul(calculateRewardPerToken(_vType).sub(userRewardsPerTokenPaid[_user][_vType]))
        .mul(DIGITS).div(PRECISION)
    );
    return userRewards.add(userCurrentRewards[_user][_vType]);
  }

  function rewardsOf(address _user) public view returns (uint256) {
    uint256 rewards = 0;
    for (uint8 i; i <= 4; ++i) {
      if (isDepV(_user, VType(i))) {
        rewards = rewards.add(rewardsOf(_user, VType(i)));
      }
    }
    return rewards;
  }

  function isDepV(address _user, VType _vType) public view returns (bool) {
    return sumUserDeposits(_user, _vType) > 0;
  }

  function isDepAV(address _user) public view returns (bool) {
    return 
      this.isDepV(_user, VType.V_1M)  || 
      this.isDepV(_user, VType.V_6M)  || 
      this.isDepV(_user, VType.V_12M) || 
      this.isDepV(_user, VType.V_24M) || 
      this.isDepV(_user, VType.V_48M);
  }

  function setStartBlock(uint256 _startBlock) external onlyOperator() {
    require(!isEmissionsStarted(), "EmSt");
    require(_startBlock >= block.number, "InvB");
    startBlock = _startBlock;
    uint256 currentTime = block.timestamp;
    uint256 currentBlock = block.number;
    uint256 lastTime = (_startBlock - currentBlock).mul(avgBlockInterval).add(currentTime);
    for (uint8 i; i <= 4; ++i) {
      lastsUpdateTime[VType(i)] = lastTime;
    }
  }

  function setAvgBlockInterval(uint256 _secondsAmount) external onlyOperator() {
    avgBlockInterval = _secondsAmount;
    emit AvgBlockIntervalChanged(block.timestamp, _secondsAmount);
  }

  function setRewardEmissionPerBlock(uint256 _amount) external onlyOperator() {
    if (isEmissionsStarted()) {
      updateAll();
    }
    rewardEmissionPerBlock = _amount;
    emit RewardEmissionPerBlockChanged(block.timestamp, _amount);
  }

  function setEarlyWithdrawalParams(uint256 _points, uint256 _perc) external onlyOperator() {
    earlyWithdrawalPoints = _points;
    earlyWithdrawalPerc = _perc;
  }

  function updateAll() private onlyOperator() {
    for (uint256 i; i < users.length; ++i) {
      for (uint8 j; j <= 4; ++j) {
        address user = users[i];
        VType vType = VType(j);
        if (isDepV(user, vType)) {
          doUpdateUserReward(user, vType);
        }
      }
    }
  }

  receive() external payable override {
    PayableUtils.sendNative(address(papparicoTreasury));
  }

  function sendToken(IERC20 _token) external override onlyAdmin() {
    require(address(_token) != address(papparicoToken), "Can't send Papparico");
    PayableUtils.sendToken(_token, address(papparicoTreasury));
  }

  function doUpdateUserReward(address _user, VType _vType) private {
    if (isEmissionsStarted()) {
      currentRewardsPerToken[_vType] = calculateRewardPerToken(_vType);
      lastsUpdateTime[_vType] = block.timestamp;
      userCurrentRewards[_user][_vType] = rewardsOf(_user, _vType);
      userRewardsPerTokenPaid[_user][_vType] = currentRewardsPerToken[_vType];
    }
  }

  modifier updateUserRewardWhenClaim(address _user) {
    if (isEmissionsStarted()) {
      for (uint8 i; i <= 4; ++i) {
        if (isDepV(_user, VType(i))) {
          doUpdateUserReward(_user, VType(i));
        }
      }
    }
    _;
  }

  modifier updateUserReward(address _user, VType _vType) {
    doUpdateUserReward(_user, _vType);
    _;
  }

  modifier validateInitialize(uint256 _startBlock, uint256 _rewardEmissionPerBlock) {
    require(!isInitialized, "Inilzd");
    require(_startBlock >= block.number, "InvB");
    require(_rewardEmissionPerBlock > 0, "Gt0");
    _;
  }

  modifier validateDeposit(uint256 _amount, VType _vType) {
    require(_amount > 0, "Gt0");
    require(papparicoToken.balanceOf(msg.sender) >= _amount, "Nfun");
    _;
  }

  modifier validateWithdrawal(VType _vType, uint256 _depId) {
    (bool exists, , , , uint256 lockedUntil) = depositExists(msg.sender, _vType, _depId);
    require(exists, "Nexists");
    require(lockedUntil <= block.timestamp, "Ntime");
    _;
  }

  modifier validateEarlyWithdrawal(VType _vType, uint256 _depId) {
    require(earlyWithdrawalPoints > 0 && earlyWithdrawalPerc > 0, "NActd");
    uint256 availablePts = frequentPoints.userAccruedPoints(msg.sender);
    require(availablePts >= earlyWithdrawalPoints, "InsuffPts");
    (bool exists, , , , uint256 lockedUntil) = depositExists(msg.sender, _vType, _depId);
    require(exists, "Nexists");
    _;
  }

  modifier validateUpgrade(VType _sourceVType, uint256 _depId, VType _targetVType) {
    (bool exists, , , , ) = depositExists(msg.sender, _sourceVType, _depId);
    require(exists, "Nexists");
    require(_sourceVType != VType.V_48M, "NUpgd");
    require(uint(_sourceVType) < uint(_targetVType), "InvSrc");
    _;
  }

  modifier onlyOperator() {
    require(hasRole(OPERATOR, msg.sender), "NOptr");
    _;
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "NAdm");
    _;
  }

  event Initialized(uint256 _timestamp);
  event AvgBlockIntervalChanged(uint256 _timestamp, uint256 _value);
  event RewardEmissionPerBlockChanged(uint256 _timestamp, uint256 _value);
  event Deposited(address indexed _user, uint256 _depositId, uint256 _amount, uint256 _vType, uint256 _timestamp);
  event Withdrawn(address indexed _user, uint256 _depositId, uint256 _amount, uint256 _vType, uint256 _timestamp);
  event Claimed(address indexed _user, uint256 _amount, uint256 _timestamp);
  event Upgraded(address indexed _user, uint256 _sourceDepId, uint256 _targetDepId, uint256 _targetVType, uint256 _timestamp);
}
