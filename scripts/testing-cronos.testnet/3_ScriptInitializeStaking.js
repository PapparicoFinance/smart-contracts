//truffle exec scripts/production/2_ScriptInitializeStaking.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoStaking = artifacts.require("PapparicoStaking");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoStakingInstance = await PapparicoStaking.deployed();

  let currentBlockNumber = await web3.eth.getBlockNumber();

  //Initialize PapparicoStaking - Params: 1 = startBlock, 2 = rewardsEmissionPerBlock
  let rewardsEmissionPerBlock = 3000;
  await papparicoStakingInstance.initialize(currentBlockNumber + 50, rewardsEmissionPerBlock, {from: DEPLOYER});

  //Set withdrawalFee
  await papparicoStakingInstance.setWithdrawalFee(1 * 100, {from: DEPLOYER}); //Multiply the desired percent by 100

	callback();
}