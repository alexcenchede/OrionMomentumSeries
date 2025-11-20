// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Orion Momentum Series (FHE Private Auctions)
 * @notice Reimagined as a sealed-bid auction house powered by the fhEVM
 *         where bids stay encrypted until the sale locks.
 */
contract OrionMomentumSeries is ZamaEthereumConfig {
    struct Auction {
        bool exists;
        string auctionId;
        address seller;
        string metadataURI;
        uint256 minBid;
        uint256 buyNowPrice;
        uint256 bidBond;
        uint256 startTime;
        uint256 endTime;
        bool cancelled;
        bool decryptable;
        bool settled;
        address winner;
        uint256 winningBid;
        uint256 amountPaid;
        address[] bidders;
    }

    struct BidEntry {
        bool exists;
        euint64 bidCipher;
        bool revealed;
        uint64 revealedAmount;
        uint256 bondPaid;
        bool bondClaimed;
    }

    uint256 public constant MIN_DURATION = 30 minutes;
    uint256 public constant MAX_DURATION = 14 days;

    mapping(string => Auction) private auctions;
    mapping(string => mapping(address => BidEntry)) private bids;
    string[] private auctionIds;

    event AuctionCreated(string indexed auctionId, address indexed seller, uint256 endTime);
    event BidPlaced(string indexed auctionId, address indexed bidder);
    event BidUpdated(string indexed auctionId, address indexed bidder);
    event BidRevealPrepared(string indexed auctionId, uint256 bidderCount);
    event BidsRevealed(string indexed auctionId, address winner, uint256 winningBid, uint256 bidderCount);
    event AuctionCancelled(string indexed auctionId);
    event WinnerSettled(string indexed auctionId, address indexed winner, uint256 amountPaid);
    event BondClaimed(string indexed auctionId, address indexed bidder, uint256 amount);
    event SellerWithdrawn(string indexed auctionId, uint256 amount);

    error AuctionExists();
    error AuctionMissing();
    error InvalidDuration();
    error InvalidAmount();
    error AuctionLocked();
    error AuctionNotActive();
    error BidExists();
    error BidMissing();
    error BondMismatch();
    error RevealAlreadyEnabled();
    error RevealNotEnabled();
    error AuctionNotSettled();
    error NoWinner();
    error NotSeller();
    error NotWinner();
    error AlreadySettled();
    error BondAlreadyClaimed();
    error WinnerMustPay();
    error NoBidders();

    /** -------------------- Auction lifecycle -------------------- */

    function createAuction(
        string memory auctionId,
        string memory metadataURI,
        uint256 minBid,
        uint256 buyNowPrice,
        uint256 duration,
        uint256 bidBond
    ) external {
        if (auctions[auctionId].exists) revert AuctionExists();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();
        if (minBid == 0) revert InvalidAmount();
        if (buyNowPrice != 0 && buyNowPrice < minBid) revert InvalidAmount();

        Auction storage auction = auctions[auctionId];
        auction.exists = true;
        auction.auctionId = auctionId;
        auction.metadataURI = metadataURI;
        auction.seller = msg.sender;
        auction.minBid = minBid;
        auction.buyNowPrice = buyNowPrice;
        auction.bidBond = bidBond;
        auction.startTime = block.timestamp;
        auction.endTime = block.timestamp + duration;
        auction.decryptable = false;

        auctionIds.push(auctionId);
        emit AuctionCreated(auctionId, msg.sender, auction.endTime);
    }

    function cancelAuction(string memory auctionId) external {
        Auction storage auction = _getAuction(auctionId);
        if (auction.seller != msg.sender) revert NotSeller();
        if (auction.settled) revert AlreadySettled();
        auction.cancelled = true;
        auction.settled = true;
        auction.decryptable = false;
        emit AuctionCancelled(auctionId);
    }

    /** -------------------- Bidding -------------------- */

    function placeEncryptedBid(
        string memory auctionId,
        externalEuint64 encryptedBid,
        bytes calldata proof
    ) external payable {
        Auction storage auction = _getAuction(auctionId);
        if (auction.cancelled) revert AuctionNotActive();
        if (block.timestamp >= auction.endTime) revert AuctionLocked();

        BidEntry storage entry = bids[auctionId][msg.sender];
        if (entry.exists) revert BidExists();
        if (msg.value != auction.bidBond) revert BondMismatch();

        euint64 cipher = FHE.fromExternal(encryptedBid, proof);
        FHE.allowThis(cipher);

        entry.exists = true;
        entry.bidCipher = cipher;
        entry.bondPaid = msg.value;

        auction.bidders.push(msg.sender);

        emit BidPlaced(auctionId, msg.sender);
    }

    function updateEncryptedBid(
        string memory auctionId,
        externalEuint64 newEncryptedBid,
        bytes calldata proof
    ) external {
        Auction storage auction = _getAuction(auctionId);
        if (auction.cancelled) revert AuctionNotActive();
        if (block.timestamp >= auction.endTime) revert AuctionLocked();

        BidEntry storage entry = bids[auctionId][msg.sender];
        if (!entry.exists) revert BidMissing();

        euint64 cipher = FHE.fromExternal(newEncryptedBid, proof);
        FHE.allowThis(cipher);
        entry.bidCipher = cipher;
        entry.revealed = false;
        entry.revealedAmount = 0;

        emit BidUpdated(auctionId, msg.sender);
    }

    /** -------------------- Reveal -------------------- */

    function enablePublicBidReveal(string memory auctionId) external {
        Auction storage auction = _getAuction(auctionId);
        if (auction.cancelled) revert AuctionNotActive();
        if (block.timestamp < auction.endTime) revert AuctionLocked();
        if (auction.settled) revert AlreadySettled();
        if (auction.decryptable) revert RevealAlreadyEnabled();
        if (auction.bidders.length == 0) revert NoBidders();

        for (uint256 i = 0; i < auction.bidders.length; i++) {
            BidEntry storage entry = bids[auctionId][auction.bidders[i]];
            FHE.makePubliclyDecryptable(entry.bidCipher);
        }

        auction.decryptable = true;

        emit BidRevealPrepared(auctionId, auction.bidders.length);
    }

    function submitAuctionReveal(
        string memory auctionId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        Auction storage auction = _getAuction(auctionId);
        if (auction.cancelled) revert AuctionNotActive();
        if (!auction.decryptable) revert RevealNotEnabled();
        if (auction.settled) revert AlreadySettled();
        if (auction.bidders.length == 0) revert NoBidders();

        bytes32[] memory handles = new bytes32[](auction.bidders.length);
        for (uint256 i = 0; i < auction.bidders.length; i++) {
            BidEntry storage entry = bids[auctionId][auction.bidders[i]];
            handles[i] = FHE.toBytes32(entry.bidCipher);
        }

        FHE.checkSignatures(handles, cleartexts, decryptionProof);
        uint64[] memory amounts = abi.decode(cleartexts, (uint64[]));
        require(amounts.length == auction.bidders.length, "Reveal length mismatch");

        uint256 highestBid = 0;
        address highestBidder = address(0);

        for (uint256 i = 0; i < amounts.length; i++) {
            address bidder = auction.bidders[i];
            BidEntry storage entry = bids[auctionId][bidder];
            entry.revealed = true;
            entry.revealedAmount = amounts[i];

            if (amounts[i] >= auction.minBid && amounts[i] > highestBid) {
                highestBid = amounts[i];
                highestBidder = bidder;
            }
        }

        auction.decryptable = false;
        auction.settled = true;
        auction.winner = highestBidder;
        auction.winningBid = highestBid;

        emit BidsRevealed(auctionId, highestBidder, highestBid, auction.bidders.length);
    }

    /** -------------------- Settlements -------------------- */

    function settleWinningBid(string memory auctionId) external payable {
        Auction storage auction = _getAuction(auctionId);
        if (!auction.settled || auction.cancelled) revert AuctionNotSettled();
        if (auction.winner == address(0)) revert NoWinner();
        if (msg.sender != auction.winner) revert NotWinner();
        if (auction.amountPaid != 0) revert AlreadySettled();
        if (msg.value != auction.winningBid) revert InvalidAmount();

        auction.amountPaid = msg.value;
        emit WinnerSettled(auctionId, msg.sender, msg.value);
    }

    function sellerWithdraw(string memory auctionId) external {
        Auction storage auction = _getAuction(auctionId);
        if (auction.seller != msg.sender) revert NotSeller();
        if (auction.amountPaid == 0) revert AuctionNotSettled();

        uint256 payout = auction.amountPaid;
        auction.amountPaid = 0;
        (bool sent, ) = payable(msg.sender).call{ value: payout }("");
        require(sent, "Transfer failed");

        emit SellerWithdrawn(auctionId, payout);
    }

    function claimBond(string memory auctionId) external {
        Auction storage auction = _requireSettledOrCancelled(auctionId);
        BidEntry storage entry = bids[auctionId][msg.sender];
        if (!entry.exists) revert BidMissing();
        if (entry.bondPaid == 0 || entry.bondClaimed) revert BondAlreadyClaimed();

        if (auction.winner == msg.sender && !auction.cancelled) {
            if (auction.amountPaid == 0) revert WinnerMustPay();
        }

        entry.bondClaimed = true;
        uint256 refund = entry.bondPaid;
        entry.bondPaid = 0;

        (bool sent, ) = payable(msg.sender).call{ value: refund }("");
        require(sent, "Bond transfer failed");

        emit BondClaimed(auctionId, msg.sender, refund);
    }

    /** -------------------- Views -------------------- */

    function getAuction(string memory auctionId)
        external
        view
        returns (
            bool exists,
            address seller,
            string memory metadataURI,
            uint256 minBid,
            uint256 buyNowPrice,
            uint256 bidBond,
            uint256 startTime,
            uint256 endTime,
            bool cancelled,
            bool settled,
            address winner,
            uint256 winningBid,
            uint256 amountPaid,
            uint256 bidderCount
        )
    {
        Auction storage auction = auctions[auctionId];
        return (
            auction.exists,
            auction.seller,
            auction.metadataURI,
            auction.minBid,
            auction.buyNowPrice,
            auction.bidBond,
            auction.startTime,
            auction.endTime,
            auction.cancelled,
            auction.settled,
            auction.winner,
            auction.winningBid,
            auction.amountPaid,
            auction.bidders.length
        );
    }

    function getBidders(string memory auctionId) external view returns (address[] memory) {
        Auction storage auction = auctions[auctionId];
        if (!auction.exists) revert AuctionMissing();
        return auction.bidders;
    }

    function getBidHandles(string memory auctionId) external view returns (bytes32[] memory) {
        Auction storage auction = auctions[auctionId];
        if (!auction.exists) revert AuctionMissing();

        bytes32[] memory handles = new bytes32[](auction.bidders.length);
        for (uint256 i = 0; i < auction.bidders.length; i++) {
            BidEntry storage entry = bids[auctionId][auction.bidders[i]];
            handles[i] = FHE.toBytes32(entry.bidCipher);
        }
        return handles;
    }

    function getBidSummary(string memory auctionId, address bidder)
        external
        view
        returns (
            bool exists,
            bool revealed,
            uint64 revealedAmount,
            uint256 bondPaid,
            bool bondClaimed,
            bool isWinner
        )
    {
        BidEntry storage entry = bids[auctionId][bidder];
        Auction storage auction = auctions[auctionId];
        bool winner = auction.winner == bidder;
        return (entry.exists, entry.revealed, entry.revealedAmount, entry.bondPaid, entry.bondClaimed, winner);
    }

    function getAllAuctionIds() external view returns (string[] memory) {
        return auctionIds;
    }

    function getAuctionCount() external view returns (uint256) {
        return auctionIds.length;
    }

    /** -------------------- Internal helpers -------------------- */

    function _getAuction(string memory auctionId) internal view returns (Auction storage) {
        Auction storage auction = auctions[auctionId];
        if (!auction.exists) revert AuctionMissing();
        return auction;
    }

    function _requireSettledOrCancelled(string memory auctionId) internal view returns (Auction storage) {
        Auction storage auction = auctions[auctionId];
        if (!auction.exists) revert AuctionMissing();
        if (!auction.settled && !auction.cancelled) revert AuctionNotSettled();
        return auction;
    }
}
