// SPDX-License-Identifier: MIT

pragma solidity 0.8.25;

import { IEAS, AttestationRequest, AttestationRequestData, RevocationRequest, RevocationRequestData } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { NO_EXPIRATION_TIME, EMPTY_UID } from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

contract DappRatingSystem {
    uint256 public dappCounter;
    mapping(bytes32 => bool) public dappIdIsRegistered;

    event DappRegistered(bytes32 indexed dappId, string name, string description, string url, string imageURL, address owner, uint256 registrationTime);
    event DappRatingSubmitted(bytes32 indexed attestationId, bytes32 indexed dappId, uint8 starRating, string reviewText);
    event DappRatingRevoked(bytes32 indexed ratingUid, address indexed revokedBy, uint256 revokedAt);

    error InvalidEAS();
    error InvalidSchemaUID();
    error InvalidRatingUID();
    error InvalidDappId();
    error InvalidStarRating();

    // The address of the global EAS contract.
    IEAS private immutable _eas;
    bytes32 private immutable _schemaUid;

    /// @notice Creates a new DappRatingSystem instance.
    /// @param eas The address of the global EAS contract.
    /// @param schema The schema UID of the DappRatingSystem.
    constructor(IEAS eas, bytes32 schema) {
        if (address(eas) == address(0)) {
            revert InvalidEAS();
        }
        if (schema == EMPTY_UID) {
            revert InvalidSchemaUID();
        }
        _eas = eas;
        _schemaUid = schema;
    }

    function registerDapp(string memory _name, string memory _description, string memory _url, string memory _imageURL) public {
        // Calculate the dappId by hashing the URL
        bytes32 _dappId = keccak256(abi.encodePacked(_url));

        // Check if the Dapp with the same URL is already registered
        require(dappIdIsRegistered[_dappId] == false, "Dapp with the same URL already registered");

        // Increment the dapp counter
        dappCounter++;
        dappIdIsRegistered[_dappId] = true;

        // Emit the DappRegistered event
        emit DappRegistered(_dappId, _name, _description, _url, _imageURL, msg.sender, block.timestamp);
    }

    function isDappRegistered(bytes32 dappId) external view returns (bool) {
        return dappIdIsRegistered[dappId];
    }

    function addDappRating(bytes32 dappId, uint8 starRating, string memory reviewText) external returns (bytes32) {
        if (dappId == EMPTY_UID || dappIdIsRegistered[dappId] == false) {
            revert InvalidDappId();
        }
        if (starRating < 1 || starRating > 5) {
            revert InvalidStarRating();
        }
        bytes32 attestation = 
            _eas.attest(
                AttestationRequest({
                    schema: _schemaUid,
                    data: AttestationRequestData({
                        recipient: address(0), // No recipient
                        expirationTime: NO_EXPIRATION_TIME, // No expiration time
                        revocable: true,
                        refUID: EMPTY_UID, // No references UI
                        data: abi.encode(dappId, starRating, reviewText), // Encode a single uint256 as a parameter to the schema
                        value: 0 // No value/ETH
                    })
                })
            );
        emit DappRatingSubmitted(attestation, dappId, starRating, reviewText);
        return attestation;
    }

    function revokeDappRating(bytes32 ratingUid) external {
        if (ratingUid == EMPTY_UID) {
            revert InvalidRatingUID();
        }
        _eas.revoke(RevocationRequest({ schema: _schemaUid, data: RevocationRequestData({ uid: ratingUid, value: 0 }) }));
        emit DappRatingRevoked(ratingUid, msg.sender, block.timestamp);
    }
}