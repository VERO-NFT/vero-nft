const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const secrets = JSON.parse(fs.readFileSync(".secrets.json").toString().trim());

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
    },
    ropsten: {
      networkCheckTimeout: 10000,
      provider: () => {
        return new HDWalletProvider(
            secrets.ropsten.mnemonic,
            `wss://ropsten.infura.io/ws/v3/${secrets.ropsten.projectId}`
        );
      },
      network_id: "3",
    },
  },
  mocha: {
  },
  compilers: {
    solc: {
      version: "0.8.4",
    }
  }
};
