//truffle exec scripts/production/1.2_ScriptGrantRoles.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const keccak256 = require('keccak256');

const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoTournaments = artifacts.require("PapparicoTournaments");
const PapparicoFrequentPlayerPoints = artifacts.require("PapparicoFrequentPlayerPoints");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();
  const papparicoVaultsInstance = await PapparicoVaults.deployed();
  const papparicoFrequentPlayerPointsInstance = await PapparicoFrequentPlayerPoints.deployed();

  //PapparicoTournaments must have SOURCE_BENEFIT role on PapparicoFrequentPlayerPoints
  let sourceBenefitRole = keccak256('SOURCE_BENEFIT');
  await papparicoFrequentPlayerPointsInstance.grantRole(sourceBenefitRole, papparicoTournamentsInstance.address, {from: DEPLOYER});

  //PapparicoVaults must have SOURCE_BENEFIT role on PapparicoFrequentPlayerPoints
  await papparicoFrequentPlayerPointsInstance.grantRole(sourceBenefitRole, papparicoVaultsInstance.address, {from: DEPLOYER});

  //PapparicoTournaments must have TARGET_BENEFIT role on PapparicoFrequentPlayerPoints
  let targetBenefitRole = keccak256('TARGET_BENEFIT');
  await papparicoFrequentPlayerPointsInstance.grantRole(targetBenefitRole, papparicoTournamentsInstance.address, {from: DEPLOYER});

  //PapparicoVaults must have TARGET_BENEFIT role on PapparicoFrequentPlayerPoints
  await papparicoFrequentPlayerPointsInstance.grantRole(targetBenefitRole, papparicoVaultsInstance.address, {from: DEPLOYER});

	callback();
}