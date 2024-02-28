const WitnetPriceTracker = artifacts.require("WitnetPriceTracker");

module.exports = async function (deployer) {
  await deployer.deploy(WitnetPriceTracker, "0xeD074DA2A76FD2Ca90C1508930b4FB4420e413B0");
};