//truffle exec scripts/production/1.3_ScriptGrantRoles.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const keccak256 = require('keccak256');
const PapparicoTournaments = artifacts.require("PapparicoTournaments");

module.exports = async function(callback) {

  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();

  //One user should be granted with the updater role in the PapparicoTournaments contract
  let updaterRole = keccak256('UPDATER');
  await papparicoTournamentsInstance.grantRole(updaterRole, "0xBe73B9BE6A356C2Fea2479219CDE8B6d5A1e46FE", {from: DEPLOYER});

	callback();
}