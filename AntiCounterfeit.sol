// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AntiCounterfeit
 * @dev A blockchain-based product authentication system
 */
contract AntiCounterfeit {
    
    struct Product {
        string productId;
        string name;
        string manufacturer;
        string batchNumber;
        uint256 timestamp;
        address registeredBy;
        bool isActive;
        uint256 verificationCount;
    }

    mapping(string => Product) private products;
    mapping(address => bool) public authorizedManufacturers;
    mapping(string => bool) private productExists;
    
    address public owner;
    uint256 public totalProducts;
    uint256 public totalVerifications;

    event ProductRegistered(
        string indexed productId,
        string name,
        string manufacturer,
        address indexed registeredBy,
        uint256 timestamp
    );

    event ProductVerified(
        string indexed productId,
        address indexed verifiedBy,
        bool isGenuine,
        uint256 timestamp
    );

    event ManufacturerAuthorized(address indexed manufacturer, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedManufacturers[msg.sender] || msg.sender == owner,
            "Not authorized to register products"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedManufacturers[msg.sender] = true;
    }

    /**
     * @dev Register a new product
     */
    function registerProduct(
        string memory _productId,
        string memory _name,
        string memory _manufacturer,
        string memory _batchNumber
    ) external onlyAuthorized returns (bool) {
        require(bytes(_productId).length > 0, "Product ID cannot be empty");
        require(!productExists[_productId], "Product already registered");

        products[_productId] = Product({
            productId: _productId,
            name: _name,
            manufacturer: _manufacturer,
            batchNumber: _batchNumber,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            isActive: true,
            verificationCount: 0
        });

        productExists[_productId] = true;
        totalProducts++;

        emit ProductRegistered(_productId, _name, _manufacturer, msg.sender, block.timestamp);
        return true;
    }

    /**
     * @dev Verify a product by its ID
     */
    function verifyProduct(string memory _productId) 
        external 
        returns (bool isGenuine, string memory name, string memory manufacturer, uint256 timestamp) 
    {
        bool genuine = productExists[_productId] && products[_productId].isActive;
        
        if (genuine) {
            products[_productId].verificationCount++;
            totalVerifications++;
        }

        emit ProductVerified(_productId, msg.sender, genuine, block.timestamp);

        if (genuine) {
            Product memory p = products[_productId];
            return (true, p.name, p.manufacturer, p.timestamp);
        }
        
        return (false, "", "", 0);
    }

    /**
     * @dev Get product details (read-only)
     */
    function getProduct(string memory _productId)
        external
        view
        returns (
            string memory productId,
            string memory name,
            string memory manufacturer,
            string memory batchNumber,
            uint256 timestamp,
            address registeredBy,
            bool isActive,
            uint256 verificationCount
        )
    {
        require(productExists[_productId], "Product not found");
        Product memory p = products[_productId];
        return (
            p.productId,
            p.name,
            p.manufacturer,
            p.batchNumber,
            p.timestamp,
            p.registeredBy,
            p.isActive,
            p.verificationCount
        );
    }

    /**
     * @dev Check if product exists
     */
    function productIsRegistered(string memory _productId) external view returns (bool) {
        return productExists[_productId];
    }

    /**
     * @dev Authorize or revoke a manufacturer
     */
    function setManufacturerAuthorization(address _manufacturer, bool _status) 
        external 
        onlyOwner 
    {
        authorizedManufacturers[_manufacturer] = _status;
        emit ManufacturerAuthorized(_manufacturer, _status);
    }

    /**
     * @dev Deactivate a product (e.g., if recalled)
     */
    function deactivateProduct(string memory _productId) external onlyOwner {
        require(productExists[_productId], "Product not found");
        products[_productId].isActive = false;
    }

    /**
     * @dev Get contract stats
     */
    function getStats() external view returns (uint256 _totalProducts, uint256 _totalVerifications) {
        return (totalProducts, totalVerifications);
    }
}
