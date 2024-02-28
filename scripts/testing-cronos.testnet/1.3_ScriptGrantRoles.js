//truffle exec scripts/testing-cronos.testnet/1.3_ScriptGrantRoles.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const keccak256 = require('keccak256');
const PapparicoTournaments = artifacts.require("PapparicoTournaments");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();

  //One user should be granted with the updater role in the PapparicoTournaments contract
  let updaterRole = keccak256('UPDATER');
  await papparicoTournamentsInstance.grantRole(updaterRole, DEPLOYER, {from: DEPLOYER});

	callback();
}