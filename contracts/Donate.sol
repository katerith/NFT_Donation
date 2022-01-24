//SPDX-License-Identifier: MIT

pragma solidity 0.8.1;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import './NFT.sol';

contract Donate is AccessControl, ReentrancyGuard {

    bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');

    NFT nft;
    uint public nftId;

    uint public minimumDonation = 0.001 ether;
    mapping(address => uint) public donations;
    address[] donators;

    event Donation(address donator, uint donation);

    constructor(address _admin) {
        _setupRole(ADMIN_ROLE, _admin);
        nft = new NFT(address(this));
    }

    function donate() external payable nonReentrant {
        require(msg.value >= minimumDonation, 'Donate: value should be above/equal the minimum donation');
        
        nftId = nft.mint();
        
        if (donations[msg.sender] == 0) {
            donators.push(msg.sender);
        }
        donations[msg.sender] += msg.value;

        emit Donation(msg.sender, msg.value);
    }

    function changeMinimunDonation(uint _newMinimumDonation) external onlyRole(ADMIN_ROLE) {
        require(_newMinimumDonation!=0, 'Donate: You can not change the minimum Donation to zero');
        minimumDonation = _newMinimumDonation;
    }

    function withdraw(address payable _to, uint _amount) external nonReentrant onlyRole(ADMIN_ROLE) returns(bool) {
        require(_to != address(0), 'Donate: You can not withdraw to zero address');
        require(address(this).balance >= 0.5 ether && address(this).balance >= _amount, 'Donate: Not enough accumulated donations to withdraw');

        _to.transfer(_amount);
        return true;
    }

    function getDonators() public view returns(address[] memory) {
        return donators;
    }

    function getDonations(address _donator) public view returns(uint) {
        return donations[_donator];
    }
}
