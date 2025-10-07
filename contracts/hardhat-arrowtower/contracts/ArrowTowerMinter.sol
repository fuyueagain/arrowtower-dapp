// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IArrowTowerNFT
 * @dev NFT 合约接口
 */
interface IArrowTowerNFT {
    function mint(address to) external returns (uint256);
    function totalSupply() external view returns (uint256);
}

/**
 * @title ArrowTowerMinter
 * @dev 箭塔村旅游纪念 NFT 铸造合约 - 独立部署版本
 * @notice 负责验证用户完成旅游路线并铸造纪念 NFT
 */
contract ArrowTowerMinter is Ownable, ReentrancyGuard {
    
    // ========== 状态变量 ==========
    
    /// @notice NFT 合约接口
    IArrowTowerNFT public nftContract;
    
    /// @notice 记录用户是否已完成旅游路线
    mapping(address => bool) public hasCompletedTour;
    
    /// @notice 记录用户是否已铸造 NFT
    mapping(address => bool) public hasMinted;
    
    /// @notice 记录用户完成路线的时间戳
    mapping(address => uint256) public tourCompletionTime;
    
    /// @notice 合约是否暂停
    bool public paused;

    // ========== 事件 ==========
    
    event TourCompleted(address indexed user, uint256 timestamp);
    event NFTMinted(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    event PausedStatusChanged(bool isPaused);

    // ========== 修饰器 ==========
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ========== 构造函数 ==========
    
    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = IArrowTowerNFT(_nftContract);
    }

    // ========== 核心功能函数 ==========
    
    /**
     * @notice 标记用户完成旅游路线
     * @param user 完成路线的用户地址
     */
    function completeTour(address user) external onlyOwner whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(!hasCompletedTour[user], "User already completed tour");
        
        hasCompletedTour[user] = true;
        tourCompletionTime[user] = block.timestamp;
        
        emit TourCompleted(user, block.timestamp);
    }

    /**
     * @notice 批量标记多个用户完成旅游路线
     * @param users 完成路线的用户地址数组
     */
    function batchCompleteTour(address[] calldata users) external onlyOwner whenNotPaused {
        uint256 length = users.length;
        require(length > 0, "Empty user array");
        require(length <= 100, "Too many users in one batch");
        
        for (uint256 i = 0; i < length; i++) {
            address user = users[i];
            
            if (user == address(0) || hasCompletedTour[user]) {
                continue;
            }
            
            hasCompletedTour[user] = true;
            tourCompletionTime[user] = block.timestamp;
            
            emit TourCompleted(user, block.timestamp);
        }
    }

    /**
     * @notice 为用户铸造 NFT
     * @param user 接收 NFT 的用户地址
     */
    function mintNFT(address user) external onlyOwner whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        require(hasCompletedTour[user], "User has not completed tour");
        require(!hasMinted[user], "User already minted NFT");
        
        hasMinted[user] = true;
        uint256 tokenId = nftContract.mint(user);
        
        emit NFTMinted(user, tokenId, block.timestamp);
    }

    /**
     * @notice 完成路线并立即铸造 NFT
     * @param user 用户地址
     */
    function completeTourAndMint(address user) external onlyOwner whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        require(!hasCompletedTour[user], "User already completed tour");
        require(!hasMinted[user], "User already minted NFT");
        
        hasCompletedTour[user] = true;
        tourCompletionTime[user] = block.timestamp;
        emit TourCompleted(user, block.timestamp);
        
        hasMinted[user] = true;
        uint256 tokenId = nftContract.mint(user);
        emit NFTMinted(user, tokenId, block.timestamp);
    }

    /**
     * @notice 批量完成路线并铸造 NFT
     * @param users 用户地址数组
     */
    function batchCompleteTourAndMint(address[] calldata users) 
        external 
        onlyOwner 
        whenNotPaused 
        nonReentrant 
    {
        uint256 length = users.length;
        require(length > 0, "Empty user array");
        require(length <= 50, "Too many users in one batch");
        
        for (uint256 i = 0; i < length; i++) {
            address user = users[i];
            
            if (user == address(0) || hasCompletedTour[user] || hasMinted[user]) {
                continue;
            }
            
            hasCompletedTour[user] = true;
            tourCompletionTime[user] = block.timestamp;
            emit TourCompleted(user, block.timestamp);
            
            hasMinted[user] = true;
            uint256 tokenId = nftContract.mint(user);
            emit NFTMinted(user, tokenId, block.timestamp);
        }
    }

    // ========== 管理员函数 ==========
    
    /**
     * @notice 更新 NFT 合约地址
     * @param _nftContract 新的 NFT 合约地址
     */
    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        address oldContract = address(nftContract);
        nftContract = IArrowTowerNFT(_nftContract);
        emit NFTContractUpdated(oldContract, _nftContract);
    }

    /**
     * @notice 暂停/恢复合约
     * @param _paused 是否暂停
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStatusChanged(_paused);
    }

    /**
     * @notice 重置用户状态
     * @param user 用户地址
     */
    function resetUserStatus(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        hasCompletedTour[user] = false;
        hasMinted[user] = false;
        tourCompletionTime[user] = 0;
    }

    // ========== 查询函数 ==========
    
    /**
     * @notice 检查用户是否可以铸造 NFT
     * @param user 用户地址
     * @return canMint 是否可以铸造
     * @return reason 不能铸造的原因
     */
    function canUserMint(address user) 
        external 
        view 
        returns (bool canMint, string memory reason) 
    {
        if (paused) {
            return (false, "Contract is paused");
        }
        if (user == address(0)) {
            return (false, "Invalid user address");
        }
        if (!hasCompletedTour[user]) {
            return (false, "User has not completed tour");
        }
        if (hasMinted[user]) {
            return (false, "User already minted NFT");
        }
        return (true, "");
    }

    /**
     * @notice 获取用户的详细状态
     * @param user 用户地址
     */
    function getUserStatus(address user) 
        external 
        view 
        returns (
            bool completedTour,
            bool minted,
            uint256 completionTime
        ) 
    {
        return (
            hasCompletedTour[user],
            hasMinted[user],
            tourCompletionTime[user]
        );
    }

    /**
     * @notice 获取合约的统计信息
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 totalMinted,
            bool isPaused,
            address nftAddress
        ) 
    {
        return (
            nftContract.totalSupply(),
            paused,
            address(nftContract)
        );
    }
}