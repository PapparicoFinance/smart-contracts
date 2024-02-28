//truffle exec scripts/testing-local/3_ScriptInitializeStaking.js

const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoStaking = artifacts.require("PapparicoStaking");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  console.log("DEPLOYER: " + deployer);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const papparicoStakingInstance = await PapparicoStaking.deployed();

  let currentBlockNumber = await web3.eth.getBlockNumber();

  //Initialize PapparicoStaking - Params: 1 = startBlock, 2 = rewardsEmissionPerBlock
  let rewardsEmissionPerBlock = 30;
  await papparicoStakingInstance.initialize(currentBlockNumber + 50, rewardsEmissionPerBlock, {from: deployer});
  
  //Set start block
  //await papparicoStakingInstance.setStartBlock(175);
  console.log("START BLOCK = ");
  console.log(toBigNumber(await papparicoStakingInstance.startBlock()).toString());

  //Set rewardsEmissionPerBlock
  //await papparicoStakingInstance.setRewardEmissionPerBlock(30);

  //Set withdrawalFee
  await papparicoStakingInstance.setWithdrawalFee(10 * 100, {from: deployer}); //Multiply the desired percent by 100

  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  let supplyAmount = (rewardsEmissionPerBlock * 60 * (14400 * 90)) / 60000; //3 months
  let supplyAmountBig = toBigNumber(supplyAmount).mul(DECIMAL_DIGITS);
  console.log("SUPPLIED = " + supplyAmountBig);

  //Supply initial rewards
  await papparicoTokenInstance.mint(papparicoStakingInstance.address, supplyAmountBig, 1, {from: deployer});

	callback();
}