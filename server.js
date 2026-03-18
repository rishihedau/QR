const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const QRCode = require("qrcode");
const crypto = require("crypto");
require("dotenv").config();

let contractConfig;
try {
  contractConfig = require("./contractConfig.json");
} catch {
  contractConfig = { contractAddress: null, abi: [] };
}

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Blockchain provider setup
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || "http://127.0.0.1:8545"
);

let contract = null;
if (contractConfig.contractAddress && contractConfig.abi.length > 0) {
  const wallet = process.env.PRIVATE_KEY
    ? new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    : null;
  contract = new ethers.Contract(
    contractConfig.contractAddress,
    contractConfig.abi,
    wallet || provider
  );
}

// ==================== ROUTES ====================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    contract: contractConfig.contractAddress || "not deployed",
    timestamp: new Date().toISOString(),
  });
});

// Get blockchain stats
app.get("/api/stats", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not deployed");
    const [totalProducts, totalVerifications] = await contract.getStats();
    const blockNumber = await provider.getBlockNumber();
    res.json({
      totalProducts: Number(totalProducts),
      totalVerifications: Number(totalVerifications),
      blockNumber,
      contractAddress: contractConfig.contractAddress,
    });
  } catch (err) {
    res.json({ totalProducts: 0, totalVerifications: 0, blockNumber: 0, error: err.message });
  }
});

// Register product
app.post("/api/register", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not deployed");
    const { productId, name, manufacturer, batchNumber } = req.body;

    if (!productId || !name || !manufacturer || !batchNumber) {
      return res.status(400).json({ error: "All fields required" });
    }

    // Check if already registered
    const exists = await contract.productIsRegistered(productId);
    if (exists) {
      return res.status(400).json({ error: "Product already registered" });
    }

    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );
    const contractWithSigner = contract.connect(wallet);
    const tx = await contractWithSigner.registerProduct(productId, name, manufacturer, batchNumber);
    const receipt = await tx.wait();

    // Generate QR data
    const qrData = JSON.stringify({
      productId,
      name,
      manufacturer,
      batchNumber,
      txHash: receipt.hash,
      timestamp: new Date().toISOString(),
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: { dark: "#0f0f1a", light: "#ffffff" },
    });

    res.json({
      success: true,
      productId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      qrCode: qrCodeDataURL,
      qrData,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// Verify product
app.post("/api/verify", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not deployed");
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ error: "Product ID required" });

    const exists = await contract.productIsRegistered(productId);
    if (!exists) {
      return res.json({ genuine: false, productId, message: "Product not found in blockchain" });
    }

    const productData = await contract.getProduct(productId);
    res.json({
      genuine: productData.isActive,
      productId,
      name: productData.name,
      manufacturer: productData.manufacturer,
      batchNumber: productData.batchNumber,
      registeredAt: new Date(Number(productData.timestamp) * 1000).toISOString(),
      verificationCount: Number(productData.verificationCount),
      registeredBy: productData.registeredBy,
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: err.message || "Verification failed" });
  }
});

// Generate product ID
app.get("/api/generate-id", (req, res) => {
  const id = `PROD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  res.json({ productId: id });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📊 Contract: ${contractConfig.contractAddress || "Not deployed yet"}`);
  console.log(`🔗 RPC: ${process.env.RPC_URL || "http://127.0.0.1:8545"}\n`);
});
