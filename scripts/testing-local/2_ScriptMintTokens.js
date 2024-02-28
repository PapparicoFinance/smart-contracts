//truffle exec scripts/testing-local/2_ScriptMintTokens.js

const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTestTokenOne = artifacts.require("PapparicoTestTokenOne");
const PapparicoTestTokenTwo = artifacts.require("PapparicoTestTokenTwo");
const PapparicoTestTokenThree = artifacts.require("PapparicoTestTokenThree");
const PapparicoTestTokenFour = artifacts.require("PapparicoTestTokenFour");
const PapparicoTournaments = artifacts.require("PapparicoTournaments");
const { toBN } = require('web3-utils');

module.exports = async function(callback) {

  const toBigNumber = toBN;
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  console.log("DEPLOYER: " + deployer);
  
  const papparicoTokenInstance = await PapparicoToken.deployed();
  const DECIMAL_DIGITS = toBigNumber("1000000000000000000");
  const DECIMAL_DIGITS_6 = toBigNumber("1000000");

  const papparicoTokenOneInstance = await PapparicoTestTokenOne.deployed();
  const papparicoTokenTwoInstance = await PapparicoTestTokenTwo.deployed();
  const papparicoTokenThreeInstance = await PapparicoTestTokenThree.deployed();
  const papparicoTokenFourInstance = await PapparicoTestTokenFour.deployed();

  const papparicoTournamentsInstance = await PapparicoTournaments.deployed();

  let mintAmount = toBigNumber(100000000).mul(DECIMAL_DIGITS);
  await papparicoTokenInstance.mint(papparicoTournamentsInstance.address, mintAmount, 0, {from: deployer});
  mintAmount = toBigNumber(120000000).mul(DECIMAL_DIGITS);
  await papparicoTokenOneInstance.mint(papparicoTournamentsInstance.address, mintAmount, {from: deployer});
  mintAmount = toBigNumber(130000000).mul(DECIMAL_DIGITS);
  await papparicoTokenTwoInstance.mint(papparicoTournamentsInstance.address, mintAmount, {from: deployer});
  mintAmount = toBigNumber(140000000).mul(DECIMAL_DIGITS);
  await papparicoTokenThreeInstance.mint(papparicoTournamentsInstance.address, mintAmount, {from: deployer});
  mintAmount = toBigNumber(150000000).mul(DECIMAL_DIGITS_6);
  await papparicoTokenFourInstance.mint(papparicoTournamentsInstance.address, mintAmount, {from: deployer});


  for (let i = 0; i <= 50; i++) {
    mintAmount = toBigNumber(5000000).mul(DECIMAL_DIGITS);
    await papparicoTokenInstance.mint(accounts[i], mintAmount, 3, {from: deployer});
    await papparicoTokenOneInstance.mint(accounts[i], mintAmount, {from: deployer});
    await papparicoTokenTwoInstance.mint(accounts[i], mintAmount, {from: deployer});
    await papparicoTokenThreeInstance.mint(accounts[i], mintAmount, {from: deployer});
    mintAmount = toBigNumber(5000000).mul(DECIMAL_DIGITS_6);
    await papparicoTokenFourInstance.mint(accounts[i], mintAmount, {from: deployer});
  }

	callback();
}