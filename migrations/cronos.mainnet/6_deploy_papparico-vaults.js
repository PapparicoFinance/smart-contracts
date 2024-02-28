const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoFrequentPlayerPoints = artifacts.require("PapparicoFrequentPlayerPoints");
const PayableUtils = artifacts.require("./lib/PayableUtils");
const DateUtils = artifacts.require("./lib/DateUtils");

module.exports = async function (deployer) {
  await deployer.link(PayableUtils, PapparicoVaults);
  await deployer.link(DateUtils, PapparicoVaults);
  await deployer.deploy(PapparicoVaults, PapparicoToken.address, PapparicoTreasury.address, PapparicoFrequentPlayerPoints.address);
};