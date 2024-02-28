//truffle exec scripts/testing-local/0_testing.js

const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoToken = artifacts.require("PapparicoToken");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  console.log("DEPLOYER: " + deployer);
  
  const papparicoVaultsInstance = await PapparicoVaults.deployed();
  const papparicoTokenInstance = await PapparicoToken.deployed();
  

  //Supply initial rewards
  let totalDeposited = await papparicoVaultsInstance.totalDepositedAllUsers();
  console.log("TOTAL DEPOSITED" + totalDeposited.toString());

  let vaultBalance = await papparicoTokenInstance.balanceOf(papparicoVaultsInstance.address);
  console.log("TOTAL VAULT BALANCE " + vaultBalance.toString());

  let rewardsSupply = (toBigNumber(vaultBalance).sub(totalDeposited)).toString();
  console.log("CURRENT REWARDS = " + rewardsSupply);

	callback();
}