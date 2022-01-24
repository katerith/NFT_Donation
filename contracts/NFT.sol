//SPDX-License-Identifier: MIT

pragma solidity 0.8.1;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import 'hardhat/console.sol';

contract NFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter public tokenIds;

    address donateAddress;

    constructor(address _donateAddress) ERC721('Receipts', 'RCPS') {
        donateAddress = _donateAddress;
    }

    function mint() public returns(uint256) {
        tokenIds.increment();
        uint256 newItemId = tokenIds.current();
        _mint(msg.sender, newItemId);
        return newItemId;
    }
}
