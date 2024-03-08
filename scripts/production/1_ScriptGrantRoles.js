//truffle exec scripts/production/1_ScriptGrantRoles.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const keccak256 = require('keccak256');
const PapparicoToken = artifacts.require("PapparicoToken");

const PapparicoTournaments = artifacts.require("PapparicoTournaments");

const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoTeamVesting = artifacts.require("PapparicoTeamVesting");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();
  const papparicoTreasuryInstance = await PapparicoTreasury.deployed();
  const papparicoTeamVestingInstance = await PapparicoTeamVesting.deployed();

  //PapparicoTeamVesting must have MINTER role on PapparicoToken
  let minterRole = keccak256('MINTER');
  await papparicoTokenInstance.grantRole(minterRole, papparicoTeamVestingInstance.address, {from: DEPLOYER});

  //PapparicoTournaments must have SENDER role on PapparicoTreasury
  let senderRole = keccak256('SENDER');
  await papparicoTreasuryInstance.grantRole(senderRole, papparicoTournamentsInstance.address, {from: DEPLOYER});

	callback();
}