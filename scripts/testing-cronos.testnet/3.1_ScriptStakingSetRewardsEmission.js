//truffle exec scripts/testing-cronos.testnet/3.1_ScriptStakingSetRewardsEmission.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;
const PapparicoStaking = artifacts.require("PapparicoStaking");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  const papparicoStakingInstance = await PapparicoStaking.at("");
  await papparicoStakingInstance.setRewardEmissionPerBlock(3000); //600000

	callback();
}