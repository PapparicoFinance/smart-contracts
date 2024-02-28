//truffle exec scripts/testing-cronos.testnet/1.4_ScriptGrantRoles.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const keccak256 = require('keccak256');
const PapparicoTournaments = artifacts.require("PapparicoTournaments");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();

  //One user should be granted with the payer role in the PapparicoTournaments contract
  let payerRole = keccak256('PAYER');
  await papparicoTournamentsInstance.grantRole(payerRole, DEPLOYER, {from: DEPLOYER});

	callback();
}