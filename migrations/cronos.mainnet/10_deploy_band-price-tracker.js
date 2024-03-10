const BandPriceTracker = artifacts.require("BandPriceTracker");

module.exports = async function (deployer) {
  await deployer.deploy(BandPriceTracker, "0xDA7a001b254CD22e46d3eAB04d937489c93174C3");
};