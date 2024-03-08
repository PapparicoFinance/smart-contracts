//truffle exec scripts/production/1.3_ScriptGrantRoles.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER, UPDATER } = process.env;

const keccak256 = require('keccak256');
const PapparicoTournaments = artifacts.require("PapparicoTournaments");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();

  //One user should be granted with the updater role in the PapparicoTournaments contract
  let updaterRole = keccak256('UPDATER');
  await papparicoTournamentsInstance.grantRole(updaterRole, UPDATER, {from: DEPLOYER});

	callback();
}