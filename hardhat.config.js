require("@nomiclabs/hardhat-waffle");
const projectId = '1b54e77793324a288aba9092361da528';
const fs = require('fs')
const keyData = fs.readFileSync('./p-key.txt', {
  encoding: 'utf8', flag: 'r'
})

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${projectId}`,
      accounts: [keyData]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      accounts: [keyData]
    }
  },
  solidity: {
    version:"0.8.1",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
