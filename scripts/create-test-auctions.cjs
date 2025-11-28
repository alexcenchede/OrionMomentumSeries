const hre = require("hardhat");

async function main() {
  const contractAddress = "0x85FEffb3fa01366f475A02F53Cf8B9C3518eDC7f";

  console.log("Creating test auctions on contract:", contractAddress);

  const OrionMomentumSeries = await hre.ethers.getContractAt("OrionMomentumSeries", contractAddress);

  // Test auction data
  const auctions = [
    {
      auctionId: "cyberpunk-001",
      metadataURI: JSON.stringify({
        title: "Cyberpunk Metropolis #001",
        description: "A stunning digital artwork featuring a futuristic cyberpunk cityscape with neon lights",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
      }),
      minBid: hre.ethers.parseEther("0.5"),
      buyNowPrice: hre.ethers.parseEther("5.0"),
      duration: 7 * 24 * 60 * 60, // 7 days
      bidBond: hre.ethers.parseEther("0.1"),
    },
    {
      auctionId: "digital-entity-002",
      metadataURI: JSON.stringify({
        title: "Digital Entity Genesis",
        description: "First generation digital entity NFT with unique AI-generated attributes",
        image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800",
      }),
      minBid: hre.ethers.parseEther("0.3"),
      buyNowPrice: hre.ethers.parseEther("3.0"),
      duration: 5 * 24 * 60 * 60, // 5 days
      bidBond: hre.ethers.parseEther("0.05"),
    },
    {
      auctionId: "holographic-003",
      metadataURI: JSON.stringify({
        title: "Holographic Dimensions",
        description: "Multi-dimensional holographic art piece exploring quantum realities",
        image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800",
      }),
      minBid: hre.ethers.parseEther("0.8"),
      buyNowPrice: hre.ethers.parseEther("8.0"),
      duration: 3 * 24 * 60 * 60, // 3 days
      bidBond: hre.ethers.parseEther("0.15"),
    },
    {
      auctionId: "neon-dreams-004",
      metadataURI: JSON.stringify({
        title: "Neon Dreams #042",
        description: "Vibrant neon-lit dreamscape from the acclaimed Neon Dreams series",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
      }),
      minBid: hre.ethers.parseEther("0.2"),
      buyNowPrice: hre.ethers.parseEther("2.0"),
      duration: 2 * 24 * 60 * 60, // 2 days
      bidBond: hre.ethers.parseEther("0.04"),
    },
  ];

  console.log(`\nCreating ${auctions.length} test auctions...\n`);

  for (const auction of auctions) {
    try {
      console.log(`Creating auction: ${auction.auctionId}`);
      const tx = await OrionMomentumSeries.createAuction(
        auction.auctionId,
        auction.metadataURI,
        auction.minBid,
        auction.buyNowPrice,
        auction.duration,
        auction.bidBond
      );

      console.log(`  Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✅ Auction created successfully\n`);
    } catch (error) {
      console.error(`  ❌ Failed to create auction ${auction.auctionId}:`, error.message);
    }
  }

  console.log("\n✅ All test auctions created!");
  console.log("\nView your auctions on the frontend at: http://localhost:8080/");
  console.log(`Contract address: ${contractAddress}`);
  console.log(`Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
