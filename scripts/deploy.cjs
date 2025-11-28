const hre = require("hardhat");

async function main() {
  console.log("Deploying OrionMomentumSeries contract to Sepolia...");

  const OrionMomentumSeries = await hre.ethers.getContractFactory("OrionMomentumSeries");
  const contract = await OrionMomentumSeries.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ OrionMomentumSeries deployed to:", address);
  console.log("\n📋 Update frontend/src/constants/contracts.ts with this address:");
  console.log(`export const ORION_MOMENTUM_SERIES_ADDRESS = "${address}" as \`0x\${string}\`;`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
