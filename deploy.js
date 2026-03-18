const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying AntiCounterfeit contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deploying with account: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy contract
  const AntiCounterfeit = await ethers.getContractFactory("AntiCounterfeit");
  const contract = await AntiCounterfeit.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ AntiCounterfeit deployed to: ${contractAddress}`);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployerAddress: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    abi: JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../artifacts/contracts/AntiCounterfeit.sol/AntiCounterfeit.json"),
        "utf8"
      )
    ).abi,
  };

  // Save to frontend
  const frontendConfigPath = path.join(__dirname, "../frontend/src/utils/contractConfig.js");
  const configContent = `// Auto-generated deployment config
export const CONTRACT_ADDRESS = "${contractAddress}";
export const NETWORK = "${hre.network.name}";
export const DEPLOYED_AT = "${new Date().toISOString()}";

export const CONTRACT_ABI = ${JSON.stringify(deploymentInfo.abi, null, 2)};
`;

  fs.writeFileSync(frontendConfigPath, configContent);
  console.log(`\n📁 Contract config saved to frontend/src/utils/contractConfig.js`);

  // Save to backend
  const backendConfigPath = path.join(__dirname, "../backend/src/contractConfig.json");
  fs.writeFileSync(backendConfigPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Contract config saved to backend/src/contractConfig.json`);

  // Seed with sample products (for demo)
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n🌱 Seeding with sample products...");
    
    const products = [
      { id: "PROD-DEMO-001", name: "Premium Sneakers", manufacturer: "NikeChain", batch: "BATCH-2024-A" },
      { id: "PROD-DEMO-002", name: "Luxury Watch", manufacturer: "RolexBlock", batch: "BATCH-2024-B" },
      { id: "PROD-DEMO-003", name: "Designer Bag", manufacturer: "LVChain", batch: "BATCH-2024-C" },
    ];

    for (const product of products) {
      await contract.registerProduct(product.id, product.name, product.manufacturer, product.batch);
      console.log(`  ✓ Registered: ${product.name} (${product.id})`);
    }
    
    console.log("\n✅ Demo products seeded!");
  }

  console.log("\n🎉 Deployment complete!");
  console.log("=".repeat(50));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
