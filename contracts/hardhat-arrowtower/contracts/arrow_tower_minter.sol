// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./arrow_tower_nft.sol";

/**
 * @title ArrowTowerMinter
 * @dev 箭扣长城村旅游纪念 NFT 铸造合约
 * @notice 负责验证用户完成旅游路线并铸造纪念 NFT
 * 
 * 功能说明：
 * - 验证用户是否完成完整旅游路线
 * - 为完成路线的用户铸造唯一的纪念 NFT
 * - 防止重复铸造
 * - 提供紧急管理功能
 * 
 * 安全机制：
 * - 只有合约所有者可以标记路线完成
 * - 防重入攻击保护
 * - 完善的状态检查
 */
contract ArrowTowerMinter is Ownable, ReentrancyGuard {
    
    // ========== 状态变量 ==========
    
    /// @notice NFT 合约实例
    ArrowTowerVillageNFT public nftContract;
    
    /// @notice 记录用户是否已完成旅游路线
    mapping(address => bool) public hasCompletedTour;
    
    /// @notice 记录用户是否已铸造 NFT（防止重复铸造）
    mapping(address => bool) public hasMinted;
    
    /// @notice 记录用户完成路线的时间戳
    mapping(address => uint256) public tourCompletionTime;
    
    /// @notice 合约是否暂停（紧急情况下使用）
    bool public paused;

    // ========== 事件 ==========
    
    /// @notice 用户完成旅游路线事件
    /// @param user 完成路线的用户地址
    /// @param timestamp 完成时间戳
    event TourCompleted(address indexed user, uint256 timestamp);
    
    /// @notice NFT 铸造事件
    /// @param user 接收 NFT 的用户地址
    /// @param tokenId 铸造的 Token ID
    /// @param timestamp 铸造时间戳
    event NFTMinted(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    
    /// @notice NFT 合约地址更新事件
    /// @param oldContract 旧合约地址
    /// @param newContract 新合约地址
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    
    /// @notice 合约暂停状态变更事件
    /// @param isPaused 是否暂停
    event PausedStatusChanged(bool isPaused);

    // ========== 修饰器 ==========
    
    /**
     * @dev 检查合约是否未暂停
     */
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // ========== 构造函数 ==========
    
    /**
     * @dev 构造函数：初始化 Minter 合约
     * @param _nftContract NFT 合约地址
     */
    constructor(address _nftContract) Ownable(msg.sender) {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = ArrowTowerVillageNFT(_nftContract);
    }

    // ========== 核心功能函数 ==========
    
    /**
     * @notice 标记用户完成旅游路线
     * @dev 仅合约所有者可调用（实际生产环境应由后端系统验证后调用）
     * @param user 完成路线的用户地址
     * 
     * 实际生产建议：
     * - 使用链下签名验证（ECDSA）
     * - 使用零知识证明（zk-SNARK）
     * - 使用地理围栏验证
     * - 使用预言机（Chainlink）验证链下数据
     */
    function completeTour(address user) external onlyOwner whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(!hasCompletedTour[user], "User already completed tour");
        
        // 标记用户完成路线
        hasCompletedTour[user] = true;
        tourCompletionTime[user] = block.timestamp;
        
        emit TourCompleted(user, block.timestamp);
    }

    /**
     * @notice 批量标记多个用户完成旅游路线
     * @dev 用于批量处理，提高 gas 效率
     * @param users 完成路线的用户地址数组
     */
    function batchCompleteTour(address[] calldata users) external onlyOwner whenNotPaused {
        uint256 length = users.length;
        require(length > 0, "Empty user array");
        require(length <= 100, "Too many users in one batch"); // 限制批量大小防止 gas 耗尽
        
        for (uint256 i = 0; i < length; i++) {
            address user = users[i];
            
            // 跳过无效地址和已完成的用户
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
     * @dev 仅合约所有者可调用，自动验证用户是否完成路线
     * @param user 接收 NFT 的用户地址
     */
    function mintNFT(address user) external onlyOwner whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        require(hasCompletedTour[user], "User has not completed tour");
        require(!hasMinted[user], "User already minted NFT");
        
        // 标记用户已铸造
        hasMinted[user] = true;
        
        // 调用 NFT 合约铸造
        uint256 tokenId = nftContract.mint(user);
        
        emit NFTMinted(user, tokenId, block.timestamp);
    }

    /**
     * @notice 完成路线并立即铸造 NFT（一步完成）
     * @dev 合并两个步骤，节省 gas 并简化流程
     * @param user 用户地址
     */
    function completeTourAndMint(address user) external onlyOwner whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        require(!hasCompletedTour[user], "User already completed tour");
        require(!hasMinted[user], "User already minted NFT");
        
        // 标记完成路线
        hasCompletedTour[user] = true;
        tourCompletionTime[user] = block.timestamp;
        emit TourCompleted(user, block.timestamp);
        
        // 标记已铸造
        hasMinted[user] = true;
        
        // 铸造 NFT
        uint256 tokenId = nftContract.mint(user);
        emit NFTMinted(user, tokenId, block.timestamp);
    }

    /**
     * @notice 批量完成路线并铸造 NFT
     * @dev 用于批量处理多个用户
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
        require(length <= 50, "Too many users in one batch"); // 铸造比标记消耗更多 gas，限制更小
        
        for (uint256 i = 0; i < length; i++) {
            address user = users[i];
            
            // 跳过无效用户和已处理的用户
            if (user == address(0) || hasCompletedTour[user] || hasMinted[user]) {
                continue;
            }
            
            // 标记完成路线
            hasCompletedTour[user] = true;
            tourCompletionTime[user] = block.timestamp;
            emit TourCompleted(user, block.timestamp);
            
            // 标记已铸造
            hasMinted[user] = true;
            
            // 铸造 NFT
            uint256 tokenId = nftContract.mint(user);
            emit NFTMinted(user, tokenId, block.timestamp);
        }
    }

    // ========== 管理员函数 ==========
    
    /**
     * @notice 更新 NFT 合约地址
     * @dev 紧急情况下可切换到新的 NFT 合约
     * @param _nftContract 新的 NFT 合约地址
     */
    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        address oldContract = address(nftContract);
        nftContract = ArrowTowerVillageNFT(_nftContract);
        emit NFTContractUpdated(oldContract, _nftContract);
    }

    /**
     * @notice 暂停/恢复合约
     * @dev 紧急情况下可暂停所有铸造操作
     * @param _paused 是否暂停
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStatusChanged(_paused);
    }

    /**
     * @notice 重置用户的完成状态（仅用于测试或纠错）
     * @dev 生产环境慎用
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
     * @return reason 不能铸造的原因（如果有）
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
     * @return completedTour 是否完成路线
     * @return minted 是否已铸造
     * @return completionTime 完成时间戳
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
     * @return totalMinted 已铸造的 NFT 总数
     * @return isPaused 合约是否暂停
     * @return nftAddress NFT 合约地址
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