// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "witnet-solidity-bridge/contracts/interfaces/IWitnetPriceRouter.sol";

contract WitnetPriceTracker {

    IWitnetPriceRouter immutable public router;

    /**
     * IMPORTANT: pass the WitnetPriceRouter address depending on 
     * the network you are using! Please find available addresses here:
     * https://docs.witnet.io/smart-contracts/price-feeds/contract-addresses
     */
    constructor(IWitnetPriceRouter _router) {
      router = _router;
    }

    function getPriceById4(bytes32 _id4) external view returns (int256 _price) {
      (_price,,) = router.valueFor(_id4);
    }

    function getSupportedCurrencyPairs() external view returns (bytes32[] memory) {
      return router.supportedCurrencyPairs();
    }
}