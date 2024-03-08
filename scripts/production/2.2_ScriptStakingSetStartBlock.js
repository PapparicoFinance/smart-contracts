//truffle exec scripts/production/2.2_ScriptStakingSetStartBlock.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;
const PapparicoStaking = artifacts.require("PapparicoStaking");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  const papparicoStakingInstance = await PapparicoStaking.deployed(); //ADD ADDRESS
  let currentBlockNumber = await web3.eth.getBlockNumber();
  await papparicoStakingInstance.setStartBlock(currentBlockNumber + 866000, {from: DEPLOYER}); //600000

	callback();
}