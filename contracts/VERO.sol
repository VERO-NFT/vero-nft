// contracts/VERO.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract VERO is ERC721 {
    uint256 private _value;

    constructor() ERC721("VERO NFT", "ʍNFT") {
    }
}
