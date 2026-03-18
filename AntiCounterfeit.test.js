const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AntiCounterfeit", function () {
  let contract;
  let owner, manufacturer, user;

  beforeEach(async function () {
    [owner, manufacturer, user] = await ethers.getSigners();
    const AntiCounterfeit = await ethers.getContractFactory("AntiCounterfeit");
    contract = await AntiCounterfeit.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should authorize owner as manufacturer", async function () {
      expect(await contract.authorizedManufacturers(owner.address)).to.be.true;
    });

    it("Should start with zero products and verifications", async function () {
      const [products, verifications] = await contract.getStats();
      expect(products).to.equal(0);
      expect(verifications).to.equal(0);
    });
  });

  describe("Product Registration", function () {
    it("Should register a product successfully", async function () {
      await contract.registerProduct("PROD-001", "Test Shoe", "TestCorp", "BATCH-A");
      const [total] = await contract.getStats();
      expect(total).to.equal(1);
    });

    it("Should emit ProductRegistered event", async function () {
      await expect(
        contract.registerProduct("PROD-001", "Test Shoe", "TestCorp", "BATCH-A")
      )
        .to.emit(contract, "ProductRegistered")
        .withArgs("PROD-001", "Test Shoe", "TestCorp", owner.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
    });

    it("Should prevent duplicate product registration", async function () {
      await contract.registerProduct("PROD-001", "Test Shoe", "TestCorp", "BATCH-A");
      await expect(
        contract.registerProduct("PROD-001", "Another Shoe", "OtherCorp", "BATCH-B")
      ).to.be.revertedWith("Product already registered");
    });

    it("Should reject empty product ID", async function () {
      await expect(
        contract.registerProduct("", "Test Shoe", "TestCorp", "BATCH-A")
      ).to.be.revertedWith("Product ID cannot be empty");
    });

    it("Should reject unauthorized manufacturers", async function () {
      await expect(
        contract.connect(user).registerProduct("PROD-001", "Fake", "Faker", "BATCH-F")
      ).to.be.revertedWith("Not authorized to register products");
    });
  });

  describe("Product Verification", function () {
    beforeEach(async function () {
      await contract.registerProduct("PROD-001", "Luxury Watch", "WatchCo", "BATCH-2024");
    });

    it("Should verify a genuine product", async function () {
      const [isGenuine, name] = await contract.verifyProduct.staticCall("PROD-001");
      expect(isGenuine).to.be.true;
      expect(name).to.equal("Luxury Watch");
    });

    it("Should return false for non-existent product", async function () {
      const [isGenuine] = await contract.verifyProduct.staticCall("FAKE-999");
      expect(isGenuine).to.be.false;
    });

    it("Should track verification count", async function () {
      await contract.verifyProduct("PROD-001");
      await contract.verifyProduct("PROD-001");
      const data = await contract.getProduct("PROD-001");
      expect(data.verificationCount).to.equal(2);
    });

    it("Should increment total verifications on chain", async function () {
      await contract.verifyProduct("PROD-001");
      const [, totalVerifications] = await contract.getStats();
      expect(totalVerifications).to.equal(1);
    });
  });

  describe("Authorization", function () {
    it("Should allow owner to authorize manufacturers", async function () {
      await contract.setManufacturerAuthorization(manufacturer.address, true);
      expect(await contract.authorizedManufacturers(manufacturer.address)).to.be.true;
    });

    it("Should allow authorized manufacturer to register products", async function () {
      await contract.setManufacturerAuthorization(manufacturer.address, true);
      await contract.connect(manufacturer).registerProduct("PROD-MFG-001", "Auth Product", "AuthCo", "B001");
      expect(await contract.productIsRegistered("PROD-MFG-001")).to.be.true;
    });

    it("Should prevent non-owner from authorizing manufacturers", async function () {
      await expect(
        contract.connect(user).setManufacturerAuthorization(manufacturer.address, true)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Product Deactivation", function () {
    it("Should allow owner to deactivate products", async function () {
      await contract.registerProduct("PROD-001", "Recalled Item", "Co", "B1");
      await contract.deactivateProduct("PROD-001");
      const data = await contract.getProduct("PROD-001");
      expect(data.isActive).to.be.false;
    });

    it("Should return not genuine for deactivated products", async function () {
      await contract.registerProduct("PROD-001", "Recalled Item", "Co", "B1");
      await contract.deactivateProduct("PROD-001");
      const [isGenuine] = await contract.verifyProduct.staticCall("PROD-001");
      expect(isGenuine).to.be.false;
    });
  });
});
