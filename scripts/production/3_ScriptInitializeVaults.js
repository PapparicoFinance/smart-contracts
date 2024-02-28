//truffle exec scripts/production/3_ScriptInitializeVaults.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoVaults = artifacts.require("PapparicoVaults");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const papparicoVaultsInstance = await PapparicoVaults.deployed();

  let currentBlockNumber = await web3.eth.getBlockNumber();
  
  //Initialize PapparicoStaking - Params: 1 = startBlock, 2 = rewardsEmissionPerBlock
  let rewardsEmissionPerBlock = 35;
  await papparicoVaultsInstance.initialize(currentBlockNumber + 50, rewardsEmissionPerBlock, {from: DEPLOYER});

  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  let supplyAmountV1M = (rewardsEmissionPerBlock  * 2  * 60 * (14400 * 90)) / 600000; //3 months
  let supplyAmountV6M = (rewardsEmissionPerBlock  * 12 * 60 * (14400 * 90)) / 600000; //3 months
  let supplyAmountV12M = (rewardsEmissionPerBlock * 24 * 60 * (14400 * 90)) / 600000; //3 months
  let supplyAmountV24M = (rewardsEmissionPerBlock * 48 * 60 * (14400 * 90)) / 600000; //3 months
  let supplyAmountV48M = (rewardsEmissionPerBlock * 96 * 60 * (14400 * 90)) / 600000; //3 months
  let supplyAmountBig = toBigNumber(supplyAmountV1M + supplyAmountV6M + supplyAmountV12M + supplyAmountV24M + supplyAmountV48M).mul(DECIMAL_DIGITS);
  console.log("SUPPLIED = " + supplyAmountBig);

  //Supply initial rewards
  await papparicoTokenInstance.mint(papparicoVaultsInstance.address, supplyAmountBig, 2, {from: DEPLOYER});

	callback();
}