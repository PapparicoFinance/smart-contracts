const PapparicoTreasury = artifacts.require("PapparicoTreasury");

module.exports = function (deployer) {
  deployer.deploy(PapparicoTreasury);
};