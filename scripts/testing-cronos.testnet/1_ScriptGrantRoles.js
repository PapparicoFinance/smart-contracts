//truffle exec scripts/testing-cronos.testnet/1_ScriptGrantRoles.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const keccak256 = require('keccak256');
const PapparicoToken = artifacts.require("PapparicoToken");

const PapparicoStaking = artifacts.require("PapparicoStaking");
const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoTournaments = artifacts.require("PapparicoTournaments");

const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoTeamVesting = artifacts.require("PapparicoTeamVesting");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const papparicoStakingInstance = await PapparicoStaking.deployed();
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();
  const papparicoTreasuryInstance = await PapparicoTreasury.deployed();
  const papparicoTeamVestingInstance = await PapparicoTeamVesting.deployed();
  const papparicoVaultsInstance = await PapparicoVaults.deployed();

  //PapparicoStaking must have MINTER role on PapparicoToken
  let minterRole = keccak256('MINTER');
  await papparicoTokenInstance.grantRole(minterRole, papparicoStakingInstance.address, {from: DEPLOYER});

  //PapparicoVaults must have MINTER role on PapparicoToken
  await papparicoTokenInstance.grantRole(minterRole, papparicoVaultsInstance.address, {from: DEPLOYER});

  //PapparicoTeamVesting must have MINTER role on PapparicoToken
  await papparicoTokenInstance.grantRole(minterRole, papparicoTeamVestingInstance.address, {from: DEPLOYER});

  //PapparicoTournaments must have SENDER role on PapparicoTreasury
  let senderRole = keccak256('SENDER');
  await papparicoTreasuryInstance.grantRole(senderRole, papparicoTournamentsInstance.address, {from: DEPLOYER});

	callback();
}