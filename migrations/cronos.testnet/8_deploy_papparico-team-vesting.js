const PapparicoTeamVesting = artifacts.require("PapparicoTeamVesting");
const PapparicoToken = artifacts.require("PapparicoToken");
const PapparicoTreasury = artifacts.require("PapparicoTreasury");

const DateUtils = artifacts.require("./lib/DateUtils");
const PayableUtils = artifacts.require("./lib/PayableUtils");

module.exports = async function (deployer) {
  await deployer.link(PayableUtils, PapparicoTeamVesting);
  await deployer.link(DateUtils, PapparicoTeamVesting);
  await deployer.deploy(PapparicoTeamVesting, PapparicoToken.address, PapparicoTreasury.address);
};