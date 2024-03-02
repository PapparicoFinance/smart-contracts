//truffle exec scripts/testing-cronos.testnet/2_ScriptMintTokens.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTournaments = artifacts.require("PapparicoTournaments");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");

  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();
  
  try {
    let mintAmount = toBigNumber(1000000000).mul(DECIMAL_DIGITS);
    await papparicoTokenInstance.mint(papparicoTournamentsInstance.address, mintAmount, 0, {from: DEPLOYER});
  } catch(err) {
    console.log("Error while minting. Msg = " + err.message);
  }

	callback();
}