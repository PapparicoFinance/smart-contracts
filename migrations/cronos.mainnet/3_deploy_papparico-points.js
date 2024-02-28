const PapparicoFrequentPlayerPoints = artifacts.require("PapparicoFrequentPlayerPoints");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PayableUtils = artifacts.require("./lib/PayableUtils");

module.exports = async function (deployer) {
  await deployer.link(PayableUtils, PapparicoFrequentPlayerPoints);
  await deployer.deploy(PapparicoFrequentPlayerPoints, PapparicoTreasury.address);
};