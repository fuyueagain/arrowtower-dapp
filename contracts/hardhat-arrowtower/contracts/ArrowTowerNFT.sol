// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArrowTowerNFT
 * @dev 极简版箭塔村旅游纪念 NFT 合约 - 移除授权功能
 */
contract ArrowTowerNFT {
    // ========== 状态变量 ==========
    string private _name;
    string private _symbol;
    string private _baseTokenURI;
    
    uint256 private _tokenIdCounter;
    address public minterContract;
    address public owner;
    
    // 只保留最基本的所有权映射
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    // ========== 事件 ==========
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Minted(address indexed to, uint256 indexed tokenId);
    event MinterContractUpdated(address indexed oldMinter, address indexed newMinter);
    event BaseURIUpdated(string newBaseURI);

    // ========== 修饰器 ==========
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }
    
    modifier onlyMinter() {
        require(msg.sender == minterContract, "Caller is not minter");
        _;
    }

    // ========== 构造函数 ==========
    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) {
        _name = name_;
        _symbol = symbol_;
        _baseTokenURI = baseURI_;
        _tokenIdCounter = 1;
        owner = msg.sender;
    }

    // ========== 管理员函数 ==========
    function setMinterContract(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter");
        emit MinterContractUpdated(minterContract, _minter);
        minterContract = _minter;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    // ========== 核心功能函数 ==========
    function mint(address to) external onlyMinter returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId);
        _tokenIdCounter++;
        
        emit Minted(to, tokenId);
        return tokenId;
    }

    // ========== 基本 ERC721 函数 ==========
    function balanceOf(address owner_) public view returns (uint256) {
        require(owner_ != address(0), "Balance query for zero address");
        return _balances[owner_];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner_ = _owners[tokenId];
        require(owner_ != address(0), "Owner query for nonexistent token");
        return owner_;
    }

    // 极简转账函数 - 只有所有者可以转账
    function transfer(address to, uint256 tokenId) public {
        address owner_ = ownerOf(tokenId);
        require(msg.sender == owner_, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to zero address");

        _balances[owner_] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(owner_, to, tokenId);
    }

    // ========== 查询函数 ==========
    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        if (bytes(_baseTokenURI).length == 0) {
            return "";
        }
        
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
    }

    // ========== 内部函数 ==========
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Mint to zero address");
        require(!_exists(tokenId), "Token already minted");

        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}