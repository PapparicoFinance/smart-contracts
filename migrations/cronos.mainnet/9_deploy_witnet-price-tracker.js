const WitnetPriceTracker = artifacts.require("WitnetPriceTracker");

module.exports = async function (deployer) {
  await deployer.deploy(WitnetPriceTracker, "0xD39D4d972C7E166856c4eb29E54D3548B4597F53");
};