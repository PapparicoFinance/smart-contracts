//truffle exec scripts/testing-cronos.testnet/2.1_ScriptMintTokens.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoToken = artifacts.require("PapparicoToken");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  console.log("DEPLOYER: " + DEPLOYER);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  
  let mintAmount = toBigNumber(25000000).mul(DECIMAL_DIGITS);

  //PAPPARICO TOKEN
  await papparicoTokenInstance.mint("0xc7CC1AA849D5C3d6A596e88680ce4f756eF01A05", mintAmount, 3, {from: DEPLOYER});
  await papparicoTokenInstance.mint(DEPLOYER, mintAmount, 3, {from: DEPLOYER});
  await papparicoTokenInstance.mint("0x297A92DAd77Acaf2B173aAE8fD1db7c55A303352", mintAmount, 3, {from: DEPLOYER});

	callback();
}