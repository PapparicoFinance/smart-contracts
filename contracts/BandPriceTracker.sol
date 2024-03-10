// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IStdReference {

  struct ReferenceData {
    uint256 rate;
    uint256 lastUpdatedBase;
    uint256 lastUpdatedQuote;
  }

  function getReferenceData(string memory _base, string memory _quote) external view returns (ReferenceData memory);

  function getReferenceDataBulk(string[] memory _bases, string[] memory _quotes) external view returns (ReferenceData[] memory);
}

contract BandPriceTracker {
  IStdReference stdReference;

  constructor(IStdReference _stdReference) {
    stdReference = _stdReference;
  }

  function getPrice(string memory _token) public view returns (uint256 rate) {
    IStdReference.ReferenceData memory data = stdReference.getReferenceData(_token, "USD");
    rate = data.rate;
  }

  function getPrices(string[] memory _tokens) external view returns (uint256[] memory rates) {
    rates = new uint256[](_tokens.length);
    for (uint i = 0; i < _tokens.length; i++) {
      rates[i] = getPrice(_tokens[i]);
    }
  }
}