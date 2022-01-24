require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

const projectId = '1b54e77793324a288aba9092361da528';
const fs = require('fs')
const keyData = fs.readFileSync('./p-key.txt', {
  encoding: 'utf8', flag: 'r'
})

const cInstance = async () => {
    const Donate = await hre.ethers.getContractFactory("Donate");
    const donate = await Donate.attach("0x273580805f41bB4a6a0c3a6B1d8aCe325b782059");
    return { donate };
}

task("donate", "Initializes a donation to donate contract")
  .addParam("value", "The value to be donated")
  .setAction(async (taskArgs) => {
    // Create the contract instance
    const { donate } = await cInstance();
    // Donate
    await donate.donate({ value: taskArgs.value });
});

task("withdraw", "Admin withdraws an amount to an address")
  .addParam("address", "The address to withdraw the amount")
  .addParam("amount", "The amount of token to withdraw")
  .setAction(async (taskArgs) => {
    // Create the contract instance
    const { donate } = await cInstance();
    // Withdraw
    await donate.withdraw(taskArgs.address, taskArgs.amount);
});

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
