//truffle exec scripts/production/3_ScriptInitializeVaults.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoVaultsInstance = await PapparicoVaults.deployed();

  let currentBlockNumber = await web3.eth.getBlockNumber();
  
  //Initialize PapparicoStaking - Params: 1 = startBlock, 2 = rewardsEmissionPerBlock
  let rewardsEmissionPerBlock = 3500;
  await papparicoVaultsInstance.initialize(currentBlockNumber + 864000, rewardsEmissionPerBlock, {from: DEPLOYER});

	callback();
}