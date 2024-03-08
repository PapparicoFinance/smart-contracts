//truffle exec scripts/production/3.2_ScriptVaultsSetStartBlock.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;
const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  const papparicoVaultsInstance = await PapparicoVaults.deployed(); //ADD ADDRESS
  let currentBlockNumber = await web3.eth.getBlockNumber();
  await papparicoVaultsInstance.setStartBlock(currentBlockNumber + 864000, {from: DEPLOYER}); //600000

	callback();
}