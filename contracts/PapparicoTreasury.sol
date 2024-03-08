// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PapparicoTreasury is AccessControl {

  using SafeERC20 for IERC20;

  bytes32 public constant TOKEN_SENDER = keccak256("SENDER");

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(TOKEN_SENDER, msg.sender);
  }

  receive() external payable { }

  function sendNative(address _to, uint256 _amount) public onlyTokenSender() {
    require(_amount > 0, "Can't send 0.");
    require(address(this).balance >= _amount, "Not enough balance.");
    payable(_to).transfer(_amount);
    emit NativeSent(_to, _amount);
  }

  function sendToken(IERC20 _token, address _to, uint256 _amount) public onlyTokenSender() {
    require(_amount > 0, "Can't send 0.");
    require(_token.balanceOf(address(this)) >= _amount, "Not enough balance.");
    _token.safeTransfer(_to, _amount);
    emit TokenSent(address(_token), _to, _amount);
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller does not have the Admin role.");
    _;
  }

  modifier onlyTokenSender() {
    require(hasRole(TOKEN_SENDER, msg.sender), "Caller does not have the Token Sender role.");
    _;
  }

  event NativeSent(address indexed _to, uint256 _amount);
  event TokenSent(address indexed _token, address indexed _to, uint256 _amount);
}