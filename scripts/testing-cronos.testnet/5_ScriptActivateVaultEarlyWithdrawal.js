//truffle exec scripts/testing-cronos.testnet/5_ScriptActivateVaultEarlyWithdrawal.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  const papparicoVaultsInstance = await PapparicoVaults.deployed();

  let earlyWithdrawalPoints = 1;
  let earlyWithdrawalPerc = 500;

  await papparicoVaultsInstance.setEarlyWithdrawalParams(earlyWithdrawalPoints, earlyWithdrawalPerc, {from: DEPLOYER});
  
  console.log("earlyWithdrawalPoints = ", earlyWithdrawalPoints);
  console.log("earlyWithdrawalPerc = ", earlyWithdrawalPerc);

	callback();
}