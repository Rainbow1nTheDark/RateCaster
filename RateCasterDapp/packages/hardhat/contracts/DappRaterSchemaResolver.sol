// SPDX-License-Identifier: MIT

pragma solidity 0.8.25;

import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";

/// @title DappRaterSchemaResolver
/// @notice A sample schema resolver that logs a uint256 input.
contract DappRaterSchemaResolver is SchemaResolver {
    mapping (address => uint) public raterToNumberOfRates;
    mapping (address => mapping (bytes32 => bool)) public raterToProjectToRated;
    mapping (bytes32 => uint) public projectToNumberOfRates;

    struct DappReview {
        bytes32 projectId;
        address raterAddress;
        uint8 starRating;
        string reviewText;
    }

    event ReviewSubmitted(bytes32 projectId, address raterAddress, uint8 starRating, string reviewText);
    event UserAlreadyRatedProject(bytes32 projectId, address raterAddress);
    event UserHasNotRatedProject(bytes32 projectId, address raterAddress);
    event ReviewRevoked(bytes32 projectId, address raterAddress, uint8 starRating);

    /// @notice Creates a new DappRaterSchemaResolver instance.
    constructor(IEAS eas) SchemaResolver(eas) {}

    /// @notice An example resolver onAttest callback that decodes a uint256 value and just logs it.
    /// @param attestation The new attestation.
    /// @return Whether the attestation is valid.
    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        (bytes32 projectId, uint8 starRating, string memory reviewText) = abi.decode(attestation.data, (bytes32, uint8, string));
        bool userRatedProject = raterToProjectToRated[attestation.attester][projectId];
        //if true, it means that the user has already rated this project - we will only allow one rating per user per project.
        if (userRatedProject) {
            emit UserAlreadyRatedProject(projectId, attestation.attester);
            return false;
        }

        DappReview memory review = DappReview(projectId, attestation.attester, starRating, reviewText);
        handleReview(review);
        raterToNumberOfRates[attestation.attester] += 1;
        projectToNumberOfRates[projectId] += 1;

        return true;
    }

    function handleReview(DappReview memory review) internal {
        emit ReviewSubmitted(review.projectId, review.raterAddress, review.starRating, review.reviewText);
    }

    /// @notice An example resolver onRevoke fallthrough callback (which currently doesn't do anything).
    /// @return Whether the attestation can be revoked.
    function onRevoke(Attestation calldata attestation, uint256 /*value*/) internal override returns (bool) {
        (bytes32 projectId, uint8 starRating, string memory reviewText) = abi.decode(attestation.data, (bytes32, uint8, string));
        bool userRatedProject = raterToProjectToRated[attestation.attester][projectId];
        //if false, it means that the user has not rated this project - the user can't revoke this review
        if (!userRatedProject) {
            emit UserHasNotRatedProject(projectId, attestation.attester);
            return false;
        }

        DappReview memory review = DappReview(projectId, attestation.attester, starRating, reviewText);
        handleReview(review);
        raterToNumberOfRates[attestation.attester] -= 1;
        projectToNumberOfRates[projectId] -= 1;

        return true;
    }
}