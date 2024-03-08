// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PapparicoTreasury.sol";
import "./IPapparicoPayable.sol";
import "./lib/PayableUtils.sol";

contract PapparicoBullishPools is AccessControl, ReentrancyGuard, IPapparicoPayable {

  using SafeMath for uint256;

  mapping(address => uint256) public accruedPoints;

  PapparicoTreasury private immutable treasury;

  constructor(PapparicoTreasury _treasury) {

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

    treasury = _treasury;
  }

  receive() external payable override { }

  function sendToken(IERC20 _token) external override onlyAdmin() {
    PayableUtils.sendToken(_token, address(treasury));
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "NAdm");
    _;
  }

  event Added(address indexed _user, uint256 indexed _value);
}