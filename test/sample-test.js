const { assert } = require("chai");
const { ethers } = require("hardhat");
var should = require('chai').should();

const deployTest = async () => {
  const [admin, account1, account2, ...rest] = await hre.ethers.getSigners();

  const Donate = await ethers.getContractFactory('Donate');
  const donate = await Donate.deploy(admin.address);
  await donate.deployed();
  const donateAddress = donate.address;

  const NFT = await ethers.getContractFactory('NFT');
  const nft = await NFT.deploy(donateAddress);
  await nft.deployed();

  return { donate, nft, admin, account1, account2, rest };
}

describe("Donate/getDonators/getDonations", ()=> {

  it("should fail if msg.value is lower than minimum amount", async ()=> {
    const { donate, account1 } = await deployTest();
    const errorMessageFromContract = 'Donate: value should be above/equal the minimum donation';
    const donation = ethers.utils.parseEther('0.000001', 'ether');
  
    await donate.connect(account1).donate({ value: donation }).should.be.revertedWith(errorMessageFromContract)
  });


  it("should mint an nft when accepting a donation from every account/should get the list of donators/donators should be unique/should be able to get the donation of every donator", async ()=> {
    const { donate, account1, account2, rest } = await deployTest();
    const donation = ethers.utils.parseEther('0.005', 'ether');
    
    // Function that returns the amount of the donators, donators are unique
    const amountOfDonators = async () => {
      let donators = await donate.getDonators();
      donators = donators.length;
      return donators;
    }

    // Function that returns the amount of the donations
    const amountOfDonations = async () => {
      const tokenIds = await donate.nftId();
      return tokenIds;
    }

    // Function that checks if the same address has donated before.
    // If so, the amount of the donators (donators.length) should not change
    // If not, the amount of the donators (donators.length) should be increased by 1.
    const donatorExist = async (donatorObj) => {
      let donators = await donate.getDonators();
      const donatorsFiltered = donators.filter( donator => 
        donator == donatorObj.address
      )
      if ( donatorsFiltered.length == 0 ) {
        assert.equal(await amountOfDonators() +1, await amountOfDonators(), 'The new donator was not added on the donators list'); 
      } else {
        assert.equal(await amountOfDonators(), await amountOfDonators(), 'The same donator was added again on the donators list'); 
      }
    }

    // For every account I initialize a donation of 0.005 ether
    for( let i=0; i<rest.length; i++ ) {
      await donate.connect(rest[i]).donate({ value: donation });
      assert.equal(i+1, await amountOfDonations(), 'The receipt was not properly minted');  
    }

    // For every account I get the donation donated
    for( let i=0; i< await amountOfDonators(); i++ ) {
      let donator = await donate.getDonators();
      donator = donator[i];
      const eachDonation = await donate.getDonations(donator);
      assert.equal(donation, eachDonation.toString(), 'The donation stored was not the one initialized');
    }

    let j = await amountOfDonations();
    j = j.toString();

    // For the same accounts I initialize again a donation of 0.005 ether, all have donated before
    for( i=++j ; i< j + rest.length; i++ ) {
      await donate.connect(rest[i-j]).donate({ value: donation });
      assert.equal(i, await amountOfDonations(), 'The receipt was not properly minted'); 
      donatorExist(rest[i-j]);
    }

    // For account1, account2 I initialize a donation of 0.005 ether (have not donated before)
    await donate.connect(account1).donate({ value: donation });
    donatorExist(account1);
    await donate.connect(account2).donate({ value: donation });
    donatorExist(account2);
  })
})

describe("changeMinimunDonation", ()=> {

  it("minimun donation should be initialized to 0.001 ether", async ()=> {
    const { donate } = await deployTest();
    const minimumDonation = ethers.utils.parseUnits('0.001', 'ether').toString();
    const minDonationContract = await donate.minimumDonation();

    assert.equal(minimumDonation, minDonationContract.toString(), 'minimun donation is not succesfully initialized to 0.001 ether');  
  })

  it("admin should be able to change minimum donation", async ()=> {
    const { donate, admin } = await deployTest();
    const minDonation = ethers.utils.parseUnits('0.5', 'ether').toString();

    await donate.connect(admin).changeMinimunDonation(minDonation);
    
    const changedMinDonation = await donate.minimumDonation();

    assert.equal(changedMinDonation.toString(), minDonation, 'minimun donation is not succesfully changed to 0.5 ether'); 
  })

  it("should fail if the admin tries to change the minimum donation to zero ", async ()=> {
    const { donate, admin } = await deployTest();
    const errorMessageFromContract = 'Donate: You can not change the minimum Donation to zero';
    const minDonation_BEFORE = await donate.minimumDonation();
  
    await donate.connect(admin).changeMinimunDonation('0').should.be.revertedWith(errorMessageFromContract)

    const minDonation_AFTER = await donate.minimumDonation();

    assert.equal(minDonation_BEFORE.toString(), minDonation_AFTER.toString(), 'minimun donation has changed, while it shouldnt'); 
  })
});

describe("withdraw", ()=> {

  it("admin should be able to withdraw donation", async ()=> {
    const formatEther = (n) => ethers.utils.formatEther(n);
    const { donate, admin, account1, account2 } = await deployTest();
    let donation = ethers.utils.parseEther('1', 'ether');
    let withdrawlAmount = ethers.utils.parseUnits('0.5', 'ether').toString();

    // I'm getting the initial Balances from donate Contract and account2 address
    const contract_Balance_INITIAL = parseFloat(formatEther(await donate.provider.getBalance(donate.address)));
    const account_2_Balance_INITIAL = parseFloat(formatEther(await ethers.provider.getBalance(account2.address)));
    
    // account1 makes a donation of 1 ether, so contract does have 1 ether balance
    await donate.connect(account1).donate({ value: donation });
    assert.equal(1, await donate.nftId(), 'The receipt was not properly minted');

    // I'm getting the Balances from donate Contract and account2 address after the donation
    const contract_Balance_DONATION = parseFloat(formatEther(await donate.provider.getBalance(donate.address)));
    const account_2_Balance_DONATION = parseFloat(formatEther(await ethers.provider.getBalance(account2.address)));

    donation = parseInt(formatEther(donation));

    assert.equal(contract_Balance_INITIAL + donation, contract_Balance_DONATION, 'The contract balance has not increased by the donation amount after the donation');
    assert.equal(account_2_Balance_INITIAL, account_2_Balance_DONATION, 'The account2 balance has changed while it should not');

    // admin withdraws of 0.5 ether to account2, so account2 does have 0.5 ether balance
    await donate.connect(admin).withdraw(account2.address, withdrawlAmount);

    // I'm getting the Balances from donate Contract and account2 address after the withdrawl
    contract_Balance_WITHDRAWAL = parseFloat(formatEther(await donate.provider.getBalance(donate.address)));
    account_2_Balance_WITHDRAWAL = parseFloat(formatEther(await ethers.provider.getBalance(account2.address)));

    withdrawlAmount = parseFloat(formatEther(withdrawlAmount));

    assert.equal(contract_Balance_DONATION - withdrawlAmount, contract_Balance_WITHDRAWAL, 'The contract balance has not decreased by the withdrawl amount after the withdrawal');
    assert.equal(account_2_Balance_DONATION + withdrawlAmount, account_2_Balance_WITHDRAWAL, 'The account2 balance increased by the withdrawl amount after the withdrawal');
  })

  it("should fail if _to addresss is address(0)", async ()=> {
    const { donate, admin } = await deployTest();
    const errorMessageFromContract = 'Donate: You can not withdraw to zero address';
    const withdrawlAmount = ethers.utils.parseUnits('0.001', 'ether').toString();
  
    await donate.connect(admin).withdraw('0x0000000000000000000000000000000000000000', withdrawlAmount).should.be.revertedWith(errorMessageFromContract);
  })

  it("should fail if the contract balance is below 0.5 ether", async ()=> {
    const { donate, admin, account1, account2, } = await deployTest();
    const errorMessageFromContract = 'Donate: Not enough accumulated donations to withdraw';
    const donation = ethers.utils.parseEther('0.2', 'ether');
    const withdrawlAmount = ethers.utils.parseUnits('0.001', 'ether').toString();

    await donate.connect(account1).donate({ value: donation });
    assert.equal(1, await donate.nftId(), 'The receipt was not properly minted'); 
    await donate.connect(admin).withdraw(account2.address, withdrawlAmount).should.be.revertedWith(errorMessageFromContract);
  })

  it("should fail if the contract balance is below the asked amount", async ()=> {
    const { donate, admin, account1, account2 } = await deployTest();
    const errorMessageFromContract = 'Donate: Not enough accumulated donations to withdraw';
    const donation = ethers.utils.parseEther('1', 'ether');
    const withdrawlAmount = ethers.utils.parseUnits('1.5', 'ether').toString();

    await donate.connect(account1).donate({ value: donation });
    assert.equal(1, await donate.nftId(), 'The receipt was not properly minted');
    await donate.connect(admin).withdraw(account2.address, withdrawlAmount).should.be.revertedWith(errorMessageFromContract);
  })
});