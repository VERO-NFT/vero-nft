# Smart Contract for Virtual Equivalents of Real Objects (VEROs)

## Status
[![CI Status](https://github.com/VERO-NFT/vero-nft/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/VERO-NFT/vero-nft/actions/workflows/ci.yml)

## Intro
To learn about what VEROs are and how they can transform funding for museums, visit the VERO web site at https://vero-nft.org

## Requirements
* Node version 12 or 14 installed

## How do I install and run this smart contract locally?
* Download the repo (obviously!) and navigate to the root folder of the repo from a Unix-based terminal.
* Install all the required packages with `npm install`.
* Start up the CLI version of Ganache, the local development blockchain software, by running `npm run ganache-start`.
* Deploy the smart contracts in Ganache by running `npm run migrate`.
* Run the test suite to make sure everything is working with `npm test`.
* You can now confidently build apps that mint NFTs with the VERO smart contract!

## How do I build apps against the VERO smart contract on Ethereum test networks?
* We already have the VERO smart contract deployed to the blockchain for a couple popular test networks. Here are the
addresses for the contracts:
  * Ropsten: *0x46d74D161e6b815e4F7d13115D58512Ab3458a90*
  * Kovan: *TBD*
* Although there isn't anything automated yet to handle approvals on the test networks, reach out to
[Joe Cora](cora.1@osu.edu) with the request. You can ask him for whatever help you need!

## Helpful information
* External functions for the VERO smart contract: [interface file](../blob/main/contracts/IVero.sol)
* VERO metadata schema: [schema file](../blob/main/schema/vero-metadata-schema.json)

## Publication of concept
Bolton, S.J. and Cora, J.R. (2021). Virtual Equivalents of Real Objects (VEROs): A type of non-fungible token
(NFT) that can help fund the 3D digitization of natural history collections. Megataxa, 6(2), pp.93–9593–95.
DOI:10.11646/MEGATAXA.6.2.2. Available at: https://www.mapress.com/mt/article/view/megataxa.6.2.2.
