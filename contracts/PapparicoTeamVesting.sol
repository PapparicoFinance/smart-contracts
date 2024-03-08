// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./PapparicoToken.sol";
import "./PapparicoStaking.sol";
import "./PapparicoTournaments.sol";
import "./PapparicoVaults.sol";
import "./PapparicoTreasury.sol";
import "./IPapparicoPayable.sol";
import "./lib/PayableUtils.sol";
import "./lib/DateUtils.sol";

contract PapparicoTeamVesting is AccessControl, IPapparicoPayable {

  using SafeMath for uint256;
  uint256 constant DIGITS = 1e18;

  bytes32 public constant SUPPLIER = keccak256("SUPPLIER");
  uint256 public totalTeam = 14_600_000_000 * DIGITS;
  uint256 public dailyVestingTeam = totalTeam.div(730);

  uint256 public lastTeamDistributionTime;
  uint256 public totalVested;

  PapparicoToken private immutable papparicoToken;
  PapparicoTreasury private immutable papparicoTreasury;

  constructor(PapparicoToken _papparicoToken, PapparicoTreasury _papparicoTreasury) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(SUPPLIER, msg.sender);

    papparicoToken = _papparicoToken;
    papparicoTreasury = _papparicoTreasury;
  }

  function calculateDistribution() public view returns (uint256, uint256) {
    if (lastTeamDistributionTime == 0) {
      return (dailyVestingTeam, 1);
    }
    uint256 diffDays = DateUtils.diffDays(lastTeamDistributionTime, block.timestamp);
    if (diffDays < 1) {
      return (0, 0);
    }
    return (dailyVestingTeam.mul(DateUtils.diffDays(lastTeamDistributionTime, block.timestamp)), diffDays);
  }

  function distributeTeamSupply(address[] memory _teamAddresses) public 
    onlySupplier() checkTeamRequirements(_teamAddresses) returns (uint256, uint256) {
    uint256 teamLength = _teamAddresses.length;
    (uint256 total, uint256 diffDays) = calculateDistribution();
    uint256 amountPerTeamMember = total.div(teamLength);

    for (uint256 i; i < teamLength; ++i) {
      distributeSupply(_teamAddresses[i], amountPerTeamMember);
    }
    totalVested = totalVested.add(total);
    lastTeamDistributionTime = block.timestamp;
    return (total, diffDays);
  }

  function distributeSupply(address _address, uint256 _amount) private onlySupplier() {
    papparicoToken.mint(_address, _amount, PapparicoToken.SupplyTarget.TEAM);
    emit SupplyDistributed(_address, block.timestamp);
  }

  receive() external payable override {
    PayableUtils.sendNative(address(papparicoTreasury));
  }

  function sendToken(IERC20 _token) external override onlyAdmin() {
    PayableUtils.sendToken(_token, address(papparicoTreasury));
  }

  modifier checkTeamRequirements(address[] memory _teamAddresses) {
    require(_teamAddresses.length > 0, "Team wallets not provided.");
    (uint256 total, uint256 diffDays) = calculateDistribution();
    require(total > 0 && diffDays > 0, "The last distribution occurred last than 24h.");
    _;
  }

  modifier onlySupplier() {
    require(hasRole(SUPPLIER, msg.sender), "Caller does not have the Supplier role.");
    _;
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller does not have the Admin role.");
    _;
  }

  event SupplyDistributed(address indexed _address, uint256 _amount);
}