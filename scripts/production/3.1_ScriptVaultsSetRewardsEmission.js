//truffle exec scripts/production/3.1_ScriptVaultsSetRewardsEmission.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;
const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  const papparicoVaultsInstance = await PapparicoVaults.deployed(); //ADD ADDRESS
  await papparicoVaultsInstance.setRewardEmissionPerBlock(3500, {from: DEPLOYER}); //600000

	callback();
}