
const hre = require("hardhat");
const fs = require('fs');

async function main() {

  const [admin, ...rest] = await hre.ethers.getSigners();
 
  const Donate = await hre.ethers.getContractFactory("Donate");
  const donate = await Donate.deploy(admin.address);
  await donate.deployed();
  console.log("donate contract deployed to:", donate.address);

  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(donate.address);
  await nft.deployed();
  console.log("nft contract deployed to:", nft.address);

  let config = `
  export const donateAddress = ${donate.address}
  export const nftAddress = ${nft.address} `

  let data = JSON.stringify(config)
  fs.writeFileSync('config.js', JSON.parse(data))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
