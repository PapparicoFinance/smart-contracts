require("dotenv").config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { PRIVATE_KEY, API_KEY } = process.env;

module.exports = {
  networks: {
    development: {
     host: "192.168.0.4",
     port: 7545,
     network_id: 19800703
    },
    cronostestnet: {
      provider: new HDWalletProvider(PRIVATE_KEY, "https://evm-t3.cronos.org/"),
      network_id: "*",
      skipDryRun: true
    },
    cronosmainnet: {
      provider: new HDWalletProvider(PRIVATE_KEY, "https://evm.cronos.org"),
      network_id: "*",
      skipDryRun: true
    },
  },
  api_keys: {
    cronoscan: API_KEY
  },
  compilers: {
    solc: {
      version: "0.8.24",
      settings: {
        optimizer: {
          enabled: false,
          runs: 200
        }
      }
    }
  },
  db: {
    enabled: false,
    host: "127.0.0.1",
  },
  plugins: ["truffle-contract-size", "truffle-plugin-verify"]
};
