//truffle exec scripts/production/2.1_ScriptStakingSetRewardsEmission.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;
const PapparicoStaking = artifacts.require("PapparicoStaking");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  const papparicoStakingInstance = await PapparicoStaking.deployed(); //ADD ADDRESS
  await papparicoStakingInstance.setRewardEmissionPerBlock(3000, {from: DEPLOYER}); //600000

	callback();
}