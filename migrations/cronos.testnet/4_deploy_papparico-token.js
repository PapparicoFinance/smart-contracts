const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PayableUtils = artifacts.require("./lib/PayableUtils");

module.exports = async function (deployer) {
  await deployer.link(PayableUtils, PapparicoToken);
  await deployer.deploy(PapparicoToken, PapparicoTreasury.address);
};