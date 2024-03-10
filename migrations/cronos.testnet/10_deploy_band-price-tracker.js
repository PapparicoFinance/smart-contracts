const BandPriceTracker = artifacts.require("BandPriceTracker");

module.exports = async function (deployer) {
  await deployer.deploy(BandPriceTracker, "0xD0b2234eB9431e850a814bCdcBCB18C1093F986B");
};