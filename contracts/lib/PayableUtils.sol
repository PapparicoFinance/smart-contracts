// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library PayableUtils {

  using SafeERC20 for IERC20;

  function sendNative(address _to) internal {
    uint256 amount = address(this).balance;
    payable(_to).transfer(amount);
    emit NativeSent(_to, amount);
  }

  function sendToken(IERC20 _token, address _to) internal {
    uint256 tokenBalance = _token.balanceOf(address(this));
    require(tokenBalance > 0, "Can't send 0.");
    _token.safeTransfer(_to, tokenBalance);
    emit TokenSent(address(_token), _to, tokenBalance);
  }

  event NativeSent(address indexed _to, uint256 _amount);
  event TokenSent(address indexed _token, address indexed _to, uint256 _amount);
}