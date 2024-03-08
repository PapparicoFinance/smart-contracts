// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IPapparicoPayable {

  receive() external payable;

  function sendToken(IERC20 _token) external;
}
