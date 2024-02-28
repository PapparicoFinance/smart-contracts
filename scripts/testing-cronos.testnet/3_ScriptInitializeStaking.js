//truffle exec scripts/testing-cronos.testnet/3_ScriptInitializeStaking.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoStaking = artifacts.require("PapparicoStaking");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const papparicoStakingInstance = await PapparicoStaking.deployed();

  let currentBlockNumber = await web3.eth.getBlockNumber();

  //Initialize PapparicoStaking - Params: 1 = startBlock, 2 = rewardsEmissionPerBlock
  let rewardsEmissionPerBlock = 30;
  await papparicoStakingInstance.initialize(currentBlockNumber + 50, rewardsEmissionPerBlock, {from: DEPLOYER});

  //Set withdrawalFee
  await papparicoStakingInstance.setWithdrawalFee(1 * 100, {from: DEPLOYER}); //Multiply the desired percent by 100

  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  let supplyAmount = (rewardsEmissionPerBlock * 60 * (14400 * 90)) / 600000; //3 months
  let supplyAmountBig = toBigNumber(supplyAmount).mul(DECIMAL_DIGITS);
  console.log("SUPPLIED = " + supplyAmountBig);

  //Supply initial rewards
  await papparicoTokenInstance.mint(papparicoStakingInstance.address, supplyAmountBig, 1, {from: DEPLOYER});

	callback();
}