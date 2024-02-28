//truffle exec scripts/production/5_ScriptActivateVaultEarlyWithdrawal.js --network cronosmainnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  const papparicoVaultsInstance = await PapparicoVaults.deployed();

  let earlyWithdrawalPoints = 10;
  let earlyWithdrawalPerc = 500;

  await papparicoVaultsInstance.setEarlyWithdrawalParams(earlyWithdrawalPoints, earlyWithdrawalPerc, {from: DEPLOYER});
  
  console.log("earlyWithdrawalPoints = ", earlyWithdrawalPoints);
  console.log("earlyWithdrawalPerc = ", earlyWithdrawalPerc);

	callback();
}