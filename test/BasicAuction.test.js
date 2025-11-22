const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("OrionMomentumSeries - Basic Auction Functionality", function () {
  let contract;
  let owner, seller, bidder1, bidder2, bidder3;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("OrionMomentumSeries");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
  });

  it("should deploy contract successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
    console.log("✅ Contract deployed at:", await contract.getAddress());
  });

  it("should have correct initial state", async function () {
    const auctionCount = await contract.getAuctionCount();
    expect(auctionCount).to.equal(0);

    const MIN_DURATION = await contract.MIN_DURATION();
    const MAX_DURATION = await contract.MAX_DURATION();
    expect(MIN_DURATION).to.equal(30 * 60); // 30 minutes
    expect(MAX_DURATION).to.equal(14 * 24 * 60 * 60); // 14 days

    console.log("✅ Initial state correct");
  });

  it("should create auction successfully", async function () {
    const auctionId = "auction-001";
    const metadataURI = JSON.stringify({
      title: "Abstract NFT #1",
      description: "A beautiful abstract piece",
      image: "https://example.com/nft1.jpg"
    });
    const minBid = ethers.parseEther("0.1");
    const buyNowPrice = ethers.parseEther("1.0");
    const duration = 3600; // 1 hour
    const bidBond = ethers.parseEther("0.01");

    const tx = await contract.connect(seller).createAuction(
      auctionId,
      metadataURI,
      minBid,
      buyNowPrice,
      duration,
      bidBond
    );

    await tx.wait();

    const auction = await contract.getAuction(auctionId);
    expect(auction.exists).to.equal(true);
    expect(auction.seller).to.equal(seller.address);
    expect(auction.metadataURI).to.equal(metadataURI);
    expect(auction.minBid).to.equal(minBid);
    expect(auction.buyNowPrice).to.equal(buyNowPrice);
    expect(auction.bidBond).to.equal(bidBond);
    expect(auction.cancelled).to.equal(false);
    expect(auction.settled).to.equal(false);

    const auctionCount = await contract.getAuctionCount();
    expect(auctionCount).to.equal(1);

    console.log("✅ Auction created successfully");
  });

  it("should prevent duplicate auction IDs", async function () {
    const auctionId = "auction-002";
    const minBid = ethers.parseEther("0.1");
    const duration = 3600;
    const bidBond = ethers.parseEther("0.01");

    await contract.connect(seller).createAuction(
      auctionId,
      "metadata",
      minBid,
      0,
      duration,
      bidBond
    );

    await expect(
      contract.connect(seller).createAuction(
        auctionId,
        "metadata2",
        minBid,
        0,
        duration,
        bidBond
      )
    ).to.be.revertedWithCustomError(contract, "AuctionExists");

    console.log("✅ Duplicate auction ID prevention works");
  });

  it("should validate duration constraints", async function () {
    const auctionId = "auction-003";
    const minBid = ethers.parseEther("0.1");
    const bidBond = ethers.parseEther("0.01");

    // Too short duration
    await expect(
      contract.connect(seller).createAuction(
        auctionId,
        "metadata",
        minBid,
        0,
        60, // 1 minute - too short
        bidBond
      )
    ).to.be.revertedWithCustomError(contract, "InvalidDuration");

    // Too long duration
    await expect(
      contract.connect(seller).createAuction(
        auctionId,
        "metadata",
        minBid,
        0,
        15 * 24 * 60 * 60, // 15 days - too long
        bidBond
      )
    ).to.be.revertedWithCustomError(contract, "InvalidDuration");

    console.log("✅ Duration validation works");
  });

  it("should validate minimum bid amount", async function () {
    const auctionId = "auction-004";
    const duration = 3600;
    const bidBond = ethers.parseEther("0.01");

    // Zero minimum bid should fail
    await expect(
      contract.connect(seller).createAuction(
        auctionId,
        "metadata",
        0, // Invalid: zero minBid
        0,
        duration,
        bidBond
      )
    ).to.be.revertedWithCustomError(contract, "InvalidAmount");

    console.log("✅ Minimum bid validation works");
  });

  it("should validate buy now price", async function () {
    const auctionId = "auction-005";
    const minBid = ethers.parseEther("1.0");
    const duration = 3600;
    const bidBond = ethers.parseEther("0.01");

    // Buy now price less than min bid should fail
    await expect(
      contract.connect(seller).createAuction(
        auctionId,
        "metadata",
        minBid,
        ethers.parseEther("0.5"), // Invalid: less than minBid
        duration,
        bidBond
      )
    ).to.be.revertedWithCustomError(contract, "InvalidAmount");

    console.log("✅ Buy now price validation works");
  });

  it("should allow seller to cancel auction", async function () {
    const auctionId = "auction-006";
    const minBid = ethers.parseEther("0.1");
    const duration = 3600;
    const bidBond = ethers.parseEther("0.01");

    await contract.connect(seller).createAuction(
      auctionId,
      "metadata",
      minBid,
      0,
      duration,
      bidBond
    );

    const tx = await contract.connect(seller).cancelAuction(auctionId);
    await tx.wait();

    const auction = await contract.getAuction(auctionId);
    expect(auction.cancelled).to.equal(true);
    expect(auction.settled).to.equal(true);

    console.log("✅ Auction cancellation works");
  });

  it("should prevent non-seller from cancelling auction", async function () {
    const auctionId = "auction-007";
    const minBid = ethers.parseEther("0.1");
    const duration = 3600;
    const bidBond = ethers.parseEther("0.01");

    await contract.connect(seller).createAuction(
      auctionId,
      "metadata",
      minBid,
      0,
      duration,
      bidBond
    );

    await expect(
      contract.connect(bidder1).cancelAuction(auctionId)
    ).to.be.revertedWithCustomError(contract, "NotSeller");

    console.log("✅ Non-seller cannot cancel auction");
  });

  it("should handle multiple auctions", async function () {
    const minBid = ethers.parseEther("0.1");
    const duration = 3600;
    const bidBond = ethers.parseEther("0.01");

    for (let i = 0; i < 5; i++) {
      await contract.connect(seller).createAuction(
        `auction-${i}`,
        `metadata-${i}`,
        minBid,
        0,
        duration,
        bidBond
      );
    }

    const auctionCount = await contract.getAuctionCount();
    expect(auctionCount).to.equal(5);

    const allIds = await contract.getAllAuctionIds();
    expect(allIds.length).to.equal(5);

    for (let i = 0; i < 5; i++) {
      expect(allIds[i]).to.equal(`auction-${i}`);
    }

    console.log("✅ Multiple auctions handled correctly");
  });

  it("should track auction timestamps correctly", async function () {
    const auctionId = "auction-008";
    const minBid = ethers.parseEther("0.1");
    const duration = 3600;
    const bidBond = ethers.parseEther("0.01");

    const beforeCreate = await ethers.provider.getBlock('latest');
    const beforeTimestamp = beforeCreate.timestamp;

    await contract.connect(seller).createAuction(
      auctionId,
      "metadata",
      minBid,
      0,
      duration,
      bidBond
    );

    const auction = await contract.getAuction(auctionId);
    expect(auction.startTime).to.be.greaterThanOrEqual(beforeTimestamp);
    expect(auction.endTime).to.equal(auction.startTime + BigInt(duration));

    console.log("✅ Timestamp tracking works correctly");
  });

  it("should return correct auction details", async function () {
    const auctionId = "auction-009";
    const metadataURI = "ipfs://QmTest123";
    const minBid = ethers.parseEther("0.5");
    const buyNowPrice = ethers.parseEther("2.0");
    const duration = 7200;
    const bidBond = ethers.parseEther("0.05");

    await contract.connect(seller).createAuction(
      auctionId,
      metadataURI,
      minBid,
      buyNowPrice,
      duration,
      bidBond
    );

    const auction = await contract.getAuction(auctionId);
    expect(auction.seller).to.equal(seller.address);
    expect(auction.metadataURI).to.equal(metadataURI);
    expect(auction.minBid).to.equal(minBid);
    expect(auction.buyNowPrice).to.equal(buyNowPrice);
    expect(auction.bidBond).to.equal(bidBond);
    expect(auction.winner).to.equal(ethers.ZeroAddress);
    expect(auction.winningBid).to.equal(0);
    expect(auction.bidderCount).to.equal(0);

    console.log("✅ Auction details returned correctly");
  });
});
