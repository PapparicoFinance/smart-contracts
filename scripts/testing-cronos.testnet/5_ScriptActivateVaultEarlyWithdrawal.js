//truffle exec scripts/testing-cronos.testnet/5_ScriptActivateVaultEarlyWithdrawal.js --network cronostestnet

require("dotenv").config();
const { DEPLOYER } = process.env;

const PapparicoVaults = artifacts.require("PapparicoVaults");

module.exports = async function(callback) {

  const papparicoVaultsInstance = await PapparicoVaults.deployed(); //.at("0xbf01aae7367f735fdcd423357ebd0645e88e14c6")

  let earlyWithdrawalPoints = 10;
  let earlyWithdrawalPerc = 500;

  await papparicoVaultsInstance.setEarlyWithdrawalParams(earlyWithdrawalPoints, earlyWithdrawalPerc, {from: DEPLOYER});
  
  console.log("earlyWithdrawalPoints = ", earlyWithdrawalPoints);
  console.log("earlyWithdrawalPerc = ", earlyWithdrawalPerc);

	callback();
}