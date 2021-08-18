const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
let secrets = {};
if (fs.existsSync('.secrets.json')) {
  secrets = JSON.parse(fs.readFileSync('.secrets.json').toString().trim());
}

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '5777',
    },
    ropsten: {
      networkCheckTimeout: 10000,
      provider: () => {
        return new HDWalletProvider(
            secrets.test.mnemonic,
            `wss://ropsten.infura.io/ws/v3/${secrets.test.projectId}`
        );
      },
      network_id: '3',
    },
    kovan: {
      networkCheckTimeout: 10000,
      provider: () => {
        return new HDWalletProvider(
            secrets.test.mnemonic,
            `wss://kovan.infura.io/ws/v3/${secrets.test.projectId}`
        );
      },
      network_id: '42',
    },
  },
  mocha: {
  },
  compilers: {
    solc: {
      version: '0.8.4',
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: secrets.test.etherscan_api_key
  }
};
