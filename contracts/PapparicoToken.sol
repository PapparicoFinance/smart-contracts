// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./PapparicoTreasury.sol";
import "./IPapparicoPayable.sol";
import "./lib/PayableUtils.sol";

contract PapparicoToken is ERC20("Papparico Finance Token", "PPFT"), AccessControl, IPapparicoPayable {

  using SafeMath for uint256;

  bytes32 public constant MINTER = keccak256("MINTER");
  bytes32 public constant BURNER = keccak256("BURNER");
  uint256 public constant DIGITS = 1e18;
  uint256 public constant MAX_SUPPLY = 73000000000 * DIGITS;

  uint256 public remainingCommunitySupply;

  uint256 public remainingTeamSupply;

  uint256 public remainingInfraSupply;

  uint256 public marketingSupply;

  enum SupplyTarget {
    TOURNAMENTS,
    STAKING,
    VAULTS,
    THIRD_PARTY,
    TEAM,
    INFRASTRUCTURE,
    MARKETING
  }

  PapparicoTreasury private immutable papparicoTreasury;

  constructor(PapparicoTreasury _papparicoTreasury) {
    papparicoTreasury = _papparicoTreasury;

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER, msg.sender);
    _grantRole(BURNER, msg.sender);

     //Community
    uint256 igo          =    146_000_000 * DIGITS; //0.2%
    uint256 liquidity    = 10_950_000_000 * DIGITS; //15%
    uint256 staking      =  3_504_000_000 * DIGITS; //4.8%
    uint256 bullishPools =  7_300_000_000 * DIGITS; //10%
    uint256 tournaments  = 14_600_000_000 * DIGITS; //20%
    uint256 vaults       = 14_600_000_000 * DIGITS; //20%

    remainingCommunitySupply = igo
      .add(liquidity)
      .add(staking)
      .add(bullishPools)
      .add(tournaments)
      .add(vaults);

    remainingTeamSupply  = 14_600_000_000 * DIGITS; //20%
    remainingInfraSupply =  3_650_000_000 * DIGITS; //5%
    marketingSupply      =  3_650_000_000 * DIGITS; //5%
  }

  function mint(address _account, uint256 _amount, SupplyTarget _supplyTarget) public onlyMinter() 
    checkMintRequirements(_amount, _supplyTarget) {
    adjustSupply(_amount, _supplyTarget);
    _mint(_account, _amount);
    emit Minted(_account, _amount, uint256(_supplyTarget), block.timestamp);
  }

  function burn(uint256 _amount) public onlyBurner() {
    _burn(msg.sender, _amount);
    emit Burnt(msg.sender, _amount, block.timestamp);
  }

  function adjustSupply(uint256 _amount, SupplyTarget _supplyTarget) private onlyMinter() {
    if (_supplyTarget == SupplyTarget.TEAM) {
      remainingTeamSupply = remainingTeamSupply.sub(_amount);
    } else if (_supplyTarget == SupplyTarget.INFRASTRUCTURE) {
      remainingInfraSupply = remainingInfraSupply.sub(_amount);
    } else if (_supplyTarget == SupplyTarget.MARKETING) {
      marketingSupply = marketingSupply.sub(_amount);
    } else {
      remainingCommunitySupply = remainingCommunitySupply.sub(_amount);
    }
  }

  function getMaxSupply() external pure returns (uint256) {
    return MAX_SUPPLY;
  }

  receive() external payable override {
    PayableUtils.sendNative(address(papparicoTreasury));
  }

  function sendToken(IERC20 _token) external override onlyAdmin() {
    PayableUtils.sendToken(_token, address(papparicoTreasury));
  }

  modifier onlyMinter() {
    require(hasRole(MINTER, msg.sender), "Not Minter");
    _;
  }

  modifier onlyBurner() {
    require(hasRole(BURNER, msg.sender), "Not Burner");
    _;
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not Admin");
    _;
  }

  modifier checkMintRequirements(uint256 _amount, SupplyTarget _supplyTarget) {
    require(_amount > 0, "You can't mint 0");
    require(_amount.add(totalSupply()) <= MAX_SUPPLY, "Minting exceeds MaxSupply");
    if (_supplyTarget == SupplyTarget.TEAM) {
      require(remainingTeamSupply >= _amount, "Exceeds the remaining team supply");
    } else if (_supplyTarget == SupplyTarget.INFRASTRUCTURE) {
      require(remainingInfraSupply >= _amount, "Exceeds the remaining infrastructure supply");
    } else if (_supplyTarget == SupplyTarget.MARKETING) {
      require(marketingSupply >= _amount, "Exceeds the remaining marketing supply");
    } else {
      require(remainingCommunitySupply >= _amount, "Exceeds the remaining community supply");
    }
    _;
  }

  event Minted(address indexed _destination, uint256 _amount, uint256 _supplyTarget, uint256 _time);
  event Burnt(address indexed _source, uint256 _amount, uint256 _time);
}
