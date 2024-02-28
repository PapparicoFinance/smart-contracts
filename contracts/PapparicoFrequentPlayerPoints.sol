// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PapparicoTreasury.sol";
import "./IPapparicoPayable.sol";
import "./lib/PayableUtils.sol";

contract PapparicoFrequentPlayerPoints is AccessControl, ReentrancyGuard, IPapparicoPayable {

  using SafeMath for uint256;

  bytes32 constant SOURCE_BENEFIT = keccak256("SOURCE_BENEFIT");
  bytes32 constant TARGET_BENEFIT = keccak256("TARGET_BENEFIT");

  mapping(address => uint256) public userAccruedPoints;
  mapping(address => uint256) public userPointsUsed;
  uint256 public totalPointsUsed;

  PapparicoTreasury private immutable treasury;

  constructor(PapparicoTreasury _treasury) {

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(SOURCE_BENEFIT, msg.sender);
    _grantRole(TARGET_BENEFIT, msg.sender);

    treasury = _treasury;
  }

  function addPoints(address _user, uint256 _amount) external nonReentrant onlySourceBenefit() {
    userAccruedPoints[_user] = userAccruedPoints[_user].add(_amount);
    emit PointsAdded(_user, _amount);
  }

  function usePoints(address _user, uint256 _amount) external nonReentrant onlyTargetBenefit() {
    require(_amount > 0, "Can't use 0");
    require(userAccruedPoints[_user] >= _amount, "Insufficient points");
    userPointsUsed[_user] = userPointsUsed[_user].add(_amount);
    totalPointsUsed = totalPointsUsed.add(_amount);
    userAccruedPoints[_user] = userAccruedPoints[_user].sub(_amount);
    emit PointsUsed(_user, _amount);
  }

  function unusePoints(address _user, uint256 _amount) external nonReentrant onlyTargetBenefit() {
    userPointsUsed[_user] = userPointsUsed[_user].sub(_amount);
    totalPointsUsed = totalPointsUsed.sub(_amount);
    userAccruedPoints[_user] = userAccruedPoints[_user].add(_amount);
    emit PointsUnused(_user, _amount);
  }

  function getUserPointsUsed(address _user) external view returns (uint256) {
    return userPointsUsed[_user];
  }

  receive() external payable override { }

  function sendToken(IERC20 _token) external override onlyAdmin() {
    PayableUtils.sendToken(_token, address(treasury));
  }

  modifier onlySourceBenefit() {
    require(hasRole(SOURCE_BENEFIT, msg.sender), "NSourBen");
    _;
  }

  modifier onlyTargetBenefit() {
    require(hasRole(TARGET_BENEFIT, msg.sender), "NTargBen");
    _;
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "NAdm");
    _;
  }

  event PointsAdded(address indexed _user, uint256 indexed _value);
  event PointsUsed(address indexed _user, uint256 indexed _value);
  event PointsUnused(address indexed _user, uint256 indexed _value);
}