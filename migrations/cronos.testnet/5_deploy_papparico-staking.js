const PapparicoStaking = artifacts.require("PapparicoStaking");
const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PayableUtils = artifacts.require("./lib/PayableUtils");

module.exports = async function (deployer) {
  deployer.link(PayableUtils, PapparicoStaking);
  deployer.deploy(PapparicoStaking, PapparicoToken.address, PapparicoTreasury.address);
};