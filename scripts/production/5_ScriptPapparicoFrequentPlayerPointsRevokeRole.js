//truffle exec scripts/production/5_ScriptPapparicoFrequentPlayerPointsRevokeRole.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;
const keccak256 = require('keccak256');
const PapparicoFrequentPlayerPoints = artifacts.require("PapparicoFrequentPlayerPoints");
const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  const papparicoFrequentPlayerPointsInstance = await PapparicoFrequentPlayerPoints.deployed();
  const papparicoVaultsInstance = await PapparicoVaults.deployed();

  let sourceBenefitRole = keccak256('SOURCE_BENEFIT');
  await papparicoFrequentPlayerPointsInstance.revokeRole(sourceBenefitRole, papparicoVaultsInstance.address, {from: DEPLOYER});

  let targetBenefitRole = keccak256('TARGET_BENEFIT');
  await papparicoFrequentPlayerPointsInstance.revokeRole(targetBenefitRole, papparicoVaultsInstance.address, {from: DEPLOYER});

	callback();
}