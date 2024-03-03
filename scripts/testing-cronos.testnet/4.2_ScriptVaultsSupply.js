//truffle exec scripts/testing-cronos.testnet/4.2_ScriptVaultsSupply.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoToken = artifacts.require("PapparicoToken");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoVaultsInstance = await PapparicoVaults.deployed();
  const papparicoTokenInstance = await PapparicoToken.deployed();

  let rewardsEmissionPerBlock = 3500;

  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  let supplyAmountV1M = (rewardsEmissionPerBlock  * 2  * 60 * (14400 * 90)) / 600000;
  let supplyAmountV6M = (rewardsEmissionPerBlock  * 12 * 60 * (14400 * 90)) / 600000;
  let supplyAmountV12M = (rewardsEmissionPerBlock * 24 * 60 * (14400 * 90)) / 600000;
  let supplyAmountV24M = (rewardsEmissionPerBlock * 48 * 60 * (14400 * 90)) / 600000;
  let supplyAmountV48M = (rewardsEmissionPerBlock * 96 * 60 * (14400 * 90)) / 600000;
  let supplyAmountBig = toBigNumber(supplyAmountV1M + supplyAmountV6M + supplyAmountV12M + supplyAmountV24M + supplyAmountV48M).mul(DECIMAL_DIGITS);
  console.log("SUPPLIED = " + supplyAmountBig);

  //Supply initial rewards
  await papparicoTokenInstance.mint(papparicoVaultsInstance.address, supplyAmountBig, 2, {from: DEPLOYER});

	callback();
}