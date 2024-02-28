//truffle exec scripts/testing-cronos.testnet/4.1_ScriptVaultsSetRewardsEmission.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;
const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  const papparicoVaultsInstance = await PapparicoVaults.at(""); //ADD ADDRESS
  await papparicoVaultsInstance.setRewardEmissionPerBlock(3500); //600000

	callback();
}