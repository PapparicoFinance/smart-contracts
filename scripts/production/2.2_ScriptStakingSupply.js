//truffle exec scripts/production/2.2_ScriptStakingSupply.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoStaking = artifacts.require("PapparicoStaking");
const PapparicoToken = artifacts.require("PapparicoToken");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoStakingInstance = await PapparicoStaking.deployed();
  const papparicoTokenInstance = await PapparicoToken.deployed();

  let rewardsEmissionPerBlock = 3000;

  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  let supplyAmount = (rewardsEmissionPerBlock * 60 * (14400 * 180)) / 600000;
  let supplyAmountBig = toBigNumber(supplyAmount).mul(DECIMAL_DIGITS);
  console.log("SUPPLIED = " + supplyAmountBig);

  await papparicoTokenInstance.mint(papparicoStakingInstance.address, supplyAmountBig, 1, {from: DEPLOYER});

	callback();
}