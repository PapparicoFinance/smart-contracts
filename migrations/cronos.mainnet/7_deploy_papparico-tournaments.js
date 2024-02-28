const PapparicoTournaments = artifacts.require("PapparicoTournaments");
const PapparicoVaults = artifacts.require("PapparicoVaults");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");
const PapparicoFrequentPlayerPoints = artifacts.require("PapparicoFrequentPlayerPoints");
const PayableUtils = artifacts.require("./lib/PayableUtils");

module.exports = async function (deployer) {
  await deployer.link(PayableUtils, PapparicoTournaments);

  await deployer.deploy(PapparicoTournaments, PapparicoVaults.address, 
    PapparicoTreasury.address, PapparicoFrequentPlayerPoints.address);
};