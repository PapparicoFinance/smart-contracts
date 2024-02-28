const PayableUtils = artifacts.require("PayableUtils");
const DateUtils = artifacts.require("DateUtils");

module.exports = async function (deployer) {
  await deployer.deploy(PayableUtils);
  await deployer.deploy(DateUtils);
};