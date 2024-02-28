// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PapparicoToken.sol";
import "./PapparicoTreasury.sol";
import "./IPapparicoPayable.sol";
import "./lib/PayableUtils.sol";

contract PapparicoStaking is AccessControl, ReentrancyGuard, IPapparicoPayable {   

  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  bytes32 constant OPERATOR = keccak256("OPERATOR");

  uint256 constant DIGITS = 1e18;
  uint256 constant PRECISION = 1e27;
  uint256 constant EMISSION = 6e1;
  uint256 constant EMISSION_PRECISION = 6e5;

  uint256 public currentRewardPerToken;
  uint256 public withdrawalFee;
  uint256 public lastUpdateTime;
  uint256 public avgBlockInterval;
  uint256 public rewardEmissionPerBlock;

  bool public isInitialized;
  uint256 public startBlock;

  uint256 public idCounter;
  address[] public users;
  mapping(address => uint256) public userIds;
  mapping(address => uint256) public userStakes;
  uint256 public totalStakedAllUsers;

  mapping(address => uint256) public userCurrentRewards;
  mapping(address => uint256) public userRewardsPerTokenPaid;
  mapping(address => uint256) public userTotalClaimed;
  uint256 public totalClaimed;

  PapparicoToken private immutable papparicoToken;
  PapparicoTreasury private immutable papparicoTreasury;

  constructor(PapparicoToken _papparicoToken, PapparicoTreasury _papparicoTreasury) {

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(OPERATOR, msg.sender);

    papparicoToken = _papparicoToken;
    papparicoTreasury = _papparicoTreasury;
    avgBlockInterval = 6 seconds;
    idCounter = 0;
  }

  function initialize(uint256 _startBlock, uint256 _rewardEmissionPerBlock) external onlyOperator()
    validateInitialize(_startBlock, _rewardEmissionPerBlock) {

    isInitialized = true;

    uint256 currentTime = block.timestamp;
    uint256 currentBlock = block.number;

    startBlock = _startBlock;
    lastUpdateTime = (_startBlock - currentBlock).mul(avgBlockInterval).add(currentTime);
    rewardEmissionPerBlock = _rewardEmissionPerBlock;

    emit Initialized(currentTime);
  }

  function stake(uint256 _amount) external nonReentrant 
    validateStaking(msg.sender, _amount)
    updateUserReward(msg.sender) {

    _claim();

    totalStakedAllUsers = totalStakedAllUsers.add(_amount);
    if (userIds[msg.sender] == 0) {
      ++idCounter;
      userIds[msg.sender] = idCounter;
      users.push(msg.sender);
    }
    userStakes[msg.sender] = userStakes[msg.sender].add(_amount);
    IERC20(papparicoToken).safeTransferFrom(msg.sender, address(this), _amount);
    emit Staked(msg.sender, _amount, block.timestamp);
  }

  function withdraw(uint256 _amount) public nonReentrant 
    validateWithdrawal(msg.sender, _amount)
    updateUserReward(msg.sender) {

    _claim();

    totalStakedAllUsers = totalStakedAllUsers.sub(_amount);
    userStakes[msg.sender] = userStakes[msg.sender].sub(_amount);
    uint256 fees = _amount.mul(withdrawalFee).div(10000);
    if (fees > 0) {
      IERC20(papparicoToken).safeTransfer(address(papparicoTreasury), fees);
    }
    IERC20(papparicoToken).safeTransfer(msg.sender, _amount.sub(fees));
    emit Withdrawn(msg.sender, _amount.sub(fees), block.timestamp);
  }

  function withdrawAll() external {
    withdraw(userStakes[msg.sender]);
  }

  function claim() public nonReentrant {
    _claim();
  }

  function _claim() private updateUserRewardWhenClaim(msg.sender) {
    uint256 rewards = userCurrentRewards[msg.sender];
    if (rewards > 0) {
      userTotalClaimed[msg.sender] = userTotalClaimed[msg.sender].add(rewards);
      totalClaimed = totalClaimed.add(rewards);
      userCurrentRewards[msg.sender] = 0;
      IERC20(papparicoToken).safeTransfer(msg.sender, rewards);
      emit Claimed(msg.sender, rewards, block.timestamp);
    }
  }

  function isEmissionsStarted() public view returns (bool) {
    return isInitialized && block.number >= startBlock;
  }

  function calculateRewardRate() private view returns (uint256) {
    return rewardEmissionPerBlock.mul(EMISSION).div(avgBlockInterval);
  }

  function calculateRewardPerToken() private view returns (uint256) {
    if (!isEmissionsStarted()) {
      return 0;
    }
    if (totalStakedAllUsers == 0) {
      return currentRewardPerToken;
    }
    return currentRewardPerToken.add((block.timestamp - lastUpdateTime)
      .mul(calculateRewardRate()).mul(PRECISION).div(EMISSION_PRECISION).div(totalStakedAllUsers));
  }

  function rewardsOf(address _user) public view returns (uint256) {
    return internalRewardsOf(_user).add(userCurrentRewards[_user]);
  }

  function internalRewardsOf(address _user) private view returns (uint256) {
    if (!isEmissionsStarted()) {
      return 0;
    }
    return userStakes[_user].mul(calculateRewardPerToken().sub(userRewardsPerTokenPaid[_user]))
      .mul(DIGITS).div(PRECISION);
  }

  function isUserStaked(address _user) public view returns (bool) {
    return userStakes[_user] > 0;
  }

  function stakesOf(address _user) public view returns (uint256) {
    return userStakes[_user];
  }

  function setStartBlock(uint256 _startBlock) external onlyOperator() {
    require(!isEmissionsStarted(), "Emissions already started");
    require(_startBlock >= block.number, "Invalid future block number");
    startBlock = _startBlock;
    uint256 currentTime = block.timestamp;
    uint256 currentBlock = block.number;
    lastUpdateTime = (_startBlock - currentBlock).mul(avgBlockInterval).add(currentTime);
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

  function updateAll() private onlyOperator() {
    for (uint256 i; i < users.length; ++i) {
      if (isUserStaked(users[i])) {
        doUpdateUserReward(users[i]);
      }
    }
  }

  function setWithdrawalFee(uint256 _fee) external onlyOperator() {
    withdrawalFee = _fee;
    emit WithdrawalFeeChanged(block.timestamp, _fee);
  }

  receive() external payable override {
    PayableUtils.sendNative(address(papparicoTreasury));
  }

  function sendToken(IERC20 _token) external override onlyAdmin() {
    require(address(_token) != address(papparicoToken), "Can't send Papparico");
    PayableUtils.sendToken(_token, address(papparicoTreasury));
  }

  function doUpdateUserReward(address _user) private {
    if (isEmissionsStarted()) {
      currentRewardPerToken = calculateRewardPerToken();
      lastUpdateTime = block.timestamp;
      userCurrentRewards[_user] = userCurrentRewards[_user].add(internalRewardsOf(_user));
      userRewardsPerTokenPaid[_user] = currentRewardPerToken;
    }
  }

  modifier updateUserRewardWhenClaim(address _user) {
    doUpdateUserReward(_user);
    _;
  }

  modifier updateUserReward(address _user) {
    doUpdateUserReward(_user);
    _;
  }

  modifier validateInitialize(uint256 _startBlock, uint256 _rewardEmissionPerBlock) {
    require(!isInitialized, "Already initialized");
    require(_startBlock >= block.number, "Invalid future block number");
    require(_rewardEmissionPerBlock > 0, "Should be greater than 0");
    _;
  }

  modifier validateStaking(address _user, uint256 _amount) {
    require(_amount > 0, "You can't stake 0");
    require(papparicoToken.balanceOf(msg.sender) >= _amount, "Not enough funds");
    _;
  }

  modifier validateWithdrawal(address _user, uint256 _amount) {
    require(_amount > 0, "You can't withdraw 0");
    require(userStakes[msg.sender] >= _amount, "Invalid amount");
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
  event WithdrawalFeeChanged(uint256 _timestamp, uint256 _value);
  event Staked(address indexed _user, uint256 _amount, uint256 _timestamp);
  event Withdrawn(address indexed _user, uint256 _amount, uint256 _timestamp);
  event Claimed(address indexed _user, uint256 _amount, uint256 _timestamp);
}