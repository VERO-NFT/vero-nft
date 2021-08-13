// contracts/Vero.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Smart contract for Virtual Equivalents of Real Objects, or VEROs for short
/// @author Joe Cora
/// @notice Supports all of the conditions in order to assure that this NFT can be confirmed
///  to become a VERO. Find additional details at https://vero-nft.org.
/// @dev Leverages the OpenZeppelin library to implement a contract that contains all of the
///  standard NFT (ERC-721) functions. Using some ERC-721 optional extension contracts to make
///  a VERO more usable on the blockchain and to have token metadata stored off the blockchain.
contract Vero is ERC721Enumerable, ERC721URIStorage {
    // Tracks VERO status for all NFTs minted against this contract
    enum VeroStatuses { PENDING, APPROVED, REJECTED }
    mapping(uint256 => VeroStatuses) private _veroStatuses;

    // Tracks uniqueness of VERO token URIs, which are stored off-chain
    string[] private _tokenUris;
    mapping(string => bool) private _tokenUriExists;

    constructor() ERC721("VERO", unicode"w̥") {}

    // VERO-specific functions ////////////////////////////////////////////////////////////////////

    /// @notice Creates an NFT with token metadata stored off-chain for sender, who should be the
    ///  owner, and stores the VERO status as PENDING. This does not create a VERO as a VERO must
    ///  be approved before it is classified as such.
    /// @param _tokenURI The token URI, stored off-chain, to use to mint the NFT
    /// @return tokenId for the newly minted NFT
    function createAsPending(string memory _tokenURI) external virtual
        returns (uint256)
    {
        require(msg.sender != address(0), "VERO: cannot mint against null address");
        require(msg.sender != address(this), "VERO: cannot mint against this contract address");

        uint256 newTokenId = _consumeTokenUri(_tokenURI);
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        _setDefaultVeroStatus(newTokenId);

        return newTokenId;
    }

    /// @notice Retrieves the VERO status for an NFT minted against the VERO smart contract
    /// @param tokenId The token upon which to set the default status
    /// @return VERO status for the NFT using VeroStatuses enum value
    function getVeroStatus(uint256 tokenId) public view virtual returns (VeroStatuses) {
        return _veroStatuses[tokenId];
    }

    /// @dev Adds the token URI to the list of used token URIs, if unused, so it cannot be reused
    /// @param @param _tokenURI The token URI to not allow for subsequent minting upon
    /// @return tokenId for the token URI
    function _consumeTokenUri(string memory _tokenUri) internal virtual returns (uint256)  {
        require(!_tokenUriExists[_tokenUri], "VERO: cannot mint with an already used token URI");

        _tokenUris.push(_tokenUri);
        uint256 tokenId = _tokenUris.length;
        _tokenUriExists[_tokenUri] = true;
        return tokenId;
    }

    /// @dev Sets the default VERO status for the NFT, which is PENDING
    /// @param tokenId The token upon which to set the default status
    function _setDefaultVeroStatus(uint256 tokenId) internal virtual {
        _veroStatuses[tokenId] = VeroStatuses.PENDING;
    }

    // Overridden functions from base contracts (functions clashes) ///////////////////////////////

    /// @notice Checks if the incoming interface ID is supported by this contract. The contract
    ///  supports standard NFT (ERC-721) interface and all of the specifications that that contract
    ///  is extended from.
    /// @dev Calls the ERC721Enumerable base method as that method extends from ERC721 and calls
    ///  that base method, too.
    /// @param interfaceId ID for the interface to check for contract support upon
    /// @return Boolean for whether the contract supports the incoming interface
    function supportsInterface(bytes4 interfaceId) public view virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return ERC721Enumerable.supportsInterface(interfaceId);
    }

    /// @notice Retrieves the token URI, which is stored off-chain, for the specified token ID
    /// @dev Calls the ERC721URIStorage base method as that method extends from ERC721 and calls
    ///  that base method, too.
    /// @param tokenId ID for the NFT created against this contract
    /// @return URI for the token
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    /// @dev Calls the ERC721Enumerable base method as that method extends from ERC721 and calls
    ///  that base method, too.
    /// @param from Blockchain address for the account transferring the NFT
    /// @param to Blockchain address for the account to which the NFT is being transferred
    /// @param tokenId ID for the NFT created against this contract
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual
        override(ERC721, ERC721Enumerable)
    {
        ERC721Enumerable._beforeTokenTransfer(from, to, tokenId);
    }

    /// @dev Calls the ERC721URIStorage base method as that method extends from ERC721 and calls
    ///  that base method, too.
    /// @param tokenId ID for the NFT created against this contract
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        ERC721URIStorage._burn(tokenId);
    }
}
