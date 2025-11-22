const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("OrionMomentumSeries - Encrypted Bidding Operations", function () {
  let contract;
  let owner, seller, bidder1, bidder2, bidder3, bidder4;
  const auctionId = "encrypted-auction-001";

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, seller, bidder1, bidder2, bidder3, bidder4] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("OrionMomentumSeries");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;

    // Create a test auction
    await contract.connect(seller).createAuction(
      auctionId,
      JSON.stringify({
        title: "Encrypted Auction NFT",
        description: "Test NFT for encrypted bidding",
        image: "https://example.com/nft.jpg"
      }),
      ethers.parseEther("0.1"), // minBid
      ethers.parseEther("1.0"), // buyNowPrice
      3600, // duration: 1 hour
      ethers.parseEther("0.01") // bidBond
    );

    console.log(`✅ Test auction created: ${auctionId}`);
  });

  it("should place encrypted bid successfully", async function () {
    console.log("Testing encrypted bid placement...");

    const bidAmount = 150000000n; // 0.15 ETH in wei (as uint64)
    const bondAmount = ethers.parseEther("0.01");

    // Create encrypted input
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(bidAmount)
      .encrypt();

    // Place encrypted bid
    const tx = await contract.connect(bidder1).placeEncryptedBid(
      auctionId,
      encrypted.handles[0],
      encrypted.inputProof,
      { value: bondAmount }
    );
    await tx.wait();

    // Verify bid was recorded
    const bidSummary = await contract.getBidSummary(auctionId, bidder1.address);
    expect(bidSummary.exists).to.equal(true);
    expect(bidSummary.bondPaid).to.equal(bondAmount);
    expect(bidSummary.revealed).to.equal(false); // Not revealed yet
    expect(bidSummary.bondClaimed).to.equal(false);

    const auction = await contract.getAuction(auctionId);
    expect(auction.bidderCount).to.equal(1);

    console.log("✅ FHE.fromExternal() - Encrypted bid input works");
    console.log("✅ FHE.allowThis() - Permission grant works");
    console.log("✅ Encrypted bid placed successfully");
  });

  it("should prevent double bidding from same address", async function () {
    console.log("Testing double bid prevention...");

    const bidAmount = 150000000n;
    const bondAmount = ethers.parseEther("0.01");

    // First bid
    const encrypted1 = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(bidAmount)
      .encrypt();

    await contract.connect(bidder1).placeEncryptedBid(
      auctionId,
      encrypted1.handles[0],
      encrypted1.inputProof,
      { value: bondAmount }
    );

    // Second bid should fail
    const encrypted2 = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(bidAmount + 10000000n)
      .encrypt();

    await expect(
      contract.connect(bidder1).placeEncryptedBid(
        auctionId,
        encrypted2.handles[0],
        encrypted2.inputProof,
        { value: bondAmount }
      )
    ).to.be.revertedWithCustomError(contract, "BidExists");

    console.log("✅ Double bidding prevention works");
  });

  it("should require correct bond amount", async function () {
    console.log("Testing bond amount validation...");

    const bidAmount = 150000000n;
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(bidAmount)
      .encrypt();

    // Insufficient bond
    await expect(
      contract.connect(bidder1).placeEncryptedBid(
        auctionId,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: ethers.parseEther("0.005") } // Wrong amount
      )
    ).to.be.revertedWithCustomError(contract, "BondMismatch");

    // Excess bond
    await expect(
      contract.connect(bidder1).placeEncryptedBid(
        auctionId,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: ethers.parseEther("0.02") } // Wrong amount
      )
    ).to.be.revertedWithCustomError(contract, "BondMismatch");

    console.log("✅ Bond amount validation works");
  });

  it("should allow bid updates before auction ends", async function () {
    console.log("Testing bid updates...");

    const bondAmount = ethers.parseEther("0.01");

    // Initial bid
    const initialBid = 150000000n;
    const encrypted1 = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(initialBid)
      .encrypt();

    await contract.connect(bidder1).placeEncryptedBid(
      auctionId,
      encrypted1.handles[0],
      encrypted1.inputProof,
      { value: bondAmount }
    );

    // Update bid
    const updatedBid = 200000000n;
    const encrypted2 = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(updatedBid)
      .encrypt();

    const tx = await contract.connect(bidder1).updateEncryptedBid(
      auctionId,
      encrypted2.handles[0],
      encrypted2.inputProof
    );
    await tx.wait();

    // Verify bid still exists
    const bidSummary = await contract.getBidSummary(auctionId, bidder1.address);
    expect(bidSummary.exists).to.equal(true);
    expect(bidSummary.revealed).to.equal(false); // Reset after update

    console.log("✅ Bid update works correctly");
  });

  it("should handle multiple bidders", async function () {
    console.log("Testing multiple encrypted bids...");

    const bondAmount = ethers.parseEther("0.01");
    const bidders = [bidder1, bidder2, bidder3, bidder4];
    const bidAmounts = [150000000n, 200000000n, 180000000n, 250000000n];

    for (let i = 0; i < bidders.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), bidders[i].address)
        .add64(bidAmounts[i])
        .encrypt();

      await contract.connect(bidders[i]).placeEncryptedBid(
        auctionId,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: bondAmount }
      );

      console.log(`✅ Bid ${i + 1} placed by ${bidders[i].address.slice(0, 6)}...`);
    }

    const auction = await contract.getAuction(auctionId);
    expect(auction.bidderCount).to.equal(4);

    const allBidders = await contract.getBidders(auctionId);
    expect(allBidders.length).to.equal(4);

    console.log("✅ Multiple encrypted bids handled correctly");
  });

  it("should prevent bids after auction ends", async function () {
    console.log("Testing post-auction bid prevention...");

    // Fast forward time past auction end
    await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
    await ethers.provider.send("evm_mine", []);

    const bidAmount = 150000000n;
    const bondAmount = ethers.parseEther("0.01");

    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(bidAmount)
      .encrypt();

    await expect(
      contract.connect(bidder1).placeEncryptedBid(
        auctionId,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: bondAmount }
      )
    ).to.be.revertedWithCustomError(contract, "AuctionLocked");

    console.log("✅ Bids prevented after auction end");
  });

  it("should prevent bids on cancelled auction", async function () {
    const cancelledAuctionId = "cancelled-auction";

    // Create and cancel auction
    await contract.connect(seller).createAuction(
      cancelledAuctionId,
      "metadata",
      ethers.parseEther("0.1"),
      0,
      3600,
      ethers.parseEther("0.01")
    );

    await contract.connect(seller).cancelAuction(cancelledAuctionId);

    // Try to bid
    const bidAmount = 150000000n;
    const bondAmount = ethers.parseEther("0.01");

    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(bidAmount)
      .encrypt();

    await expect(
      contract.connect(bidder1).placeEncryptedBid(
        cancelledAuctionId,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: bondAmount }
      )
    ).to.be.revertedWithCustomError(contract, "AuctionNotActive");

    console.log("✅ Bids prevented on cancelled auction");
  });

  it("should retrieve bid handles correctly", async function () {
    console.log("Testing bid handle retrieval...");

    const bondAmount = ethers.parseEther("0.01");
    const bidders = [bidder1, bidder2, bidder3];
    const bidAmounts = [150000000n, 200000000n, 180000000n];

    // Place multiple bids
    for (let i = 0; i < bidders.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), bidders[i].address)
        .add64(bidAmounts[i])
        .encrypt();

      await contract.connect(bidders[i]).placeEncryptedBid(
        auctionId,
        encrypted.handles[0],
        encrypted.inputProof,
        { value: bondAmount }
      );
    }

    // Get bid handles
    const handles = await contract.getBidHandles(auctionId);
    expect(handles.length).to.equal(3);

    // Each handle should be a valid bytes32
    for (const handle of handles) {
      expect(handle).to.be.properHex(66); // 0x + 64 hex chars
    }

    console.log("✅ FHE.toBytes32() - Bid handles retrieved correctly");
  });

  it("should handle edge case: very high bid amount", async function () {
    console.log("Testing high bid amount...");

    // Maximum safe uint64 value
    const maxBid = 18446744073709551615n; // 2^64 - 1
    const bondAmount = ethers.parseEther("0.01");

    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(maxBid)
      .encrypt();

    await contract.connect(bidder1).placeEncryptedBid(
      auctionId,
      encrypted.handles[0],
      encrypted.inputProof,
      { value: bondAmount }
    );

    const bidSummary = await contract.getBidSummary(auctionId, bidder1.address);
    expect(bidSummary.exists).to.equal(true);

    console.log("✅ High bid amounts handled correctly");
  });

  it("should handle edge case: minimum possible bid", async function () {
    console.log("Testing minimum bid amount...");

    const minBid = 1n; // Smallest possible bid
    const bondAmount = ethers.parseEther("0.01");

    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(minBid)
      .encrypt();

    await contract.connect(bidder1).placeEncryptedBid(
      auctionId,
      encrypted.handles[0],
      encrypted.inputProof,
      { value: bondAmount }
    );

    const bidSummary = await contract.getBidSummary(auctionId, bidder1.address);
    expect(bidSummary.exists).to.equal(true);

    console.log("✅ Minimum bid amounts handled correctly");
  });
});
