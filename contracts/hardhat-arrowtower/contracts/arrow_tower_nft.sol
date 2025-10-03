// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Counters 库
 * @dev 用于 Token ID 自增计数器（OpenZeppelin 5.x 已移除此库，需手动实现）
 */
library Counters {
    struct Counter {
        uint256 _value; // 当前计数值
    }

    /**
     * @dev 获取当前计数值
     */
    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    /**
     * @dev 计数器自增 1
     */
    function increment(Counter storage counter) internal {
        counter._value += 1;
    }

    /**
     * @dev 重置计数器为 0
     */
    function reset(Counter storage counter) internal {
        counter._value = 0;
    }
}

/**
 * @title ArrowTowerVillageNFT
 * @dev 箭扣长城村旅游纪念 NFT 合约
 * @notice 只有授权的 Minter 合约可以调用铸造函数
 * 
 * 功能说明：
 * - ERC721 标准 NFT 实现
 * - 仅授权的 Minter 合约可以铸造
 * - 支持元数据 URI（兼容 OpenSea 等平台）
 * - 追踪每个地址拥有的 Token ID
 * - 自动处理 NFT 转移时的数据同步
 */
contract ArrowTowerVillageNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // ========== 状态变量 ==========
    
    /// @notice Token ID 自增计数器
    Counters.Counter private _tokenIdCounter;
    
    /// @notice 授权的 Minter 合约地址
    address public minterContract;
    
    /// @notice NFT 元数据基础 URI
    string private _baseTokenURI;
    
    /// @notice 记录每个地址拥有的所有 Token ID
    /// @dev 便于前端快速查询用户的 NFT 列表
    mapping(address => uint256[]) private tokensOfOwner;

    // ========== 事件 ==========
    
    /// @notice 铸造事件
    /// @param to 接收 NFT 的地址
    /// @param tokenId 铸造的 Token ID
    event Minted(address indexed to, uint256 indexed tokenId);
    
    /// @notice Minter 合约地址更新事件
    /// @param oldMinter 旧的 Minter 地址
    /// @param newMinter 新的 Minter 地址
    event MinterContractUpdated(address indexed oldMinter, address indexed newMinter);
    
    /// @notice 基础 URI 更新事件
    /// @param newBaseURI 新的基础 URI
    event BaseURIUpdated(string newBaseURI);

    // ========== 构造函数 ==========
    
    /**
     * @dev 构造函数：初始化 NFT 合约
     * @notice Token ID 从 1 开始（更符合常规习惯）
     */
    constructor() ERC721("ArrowTowerVillage", "ATV") Ownable(msg.sender) {
        _tokenIdCounter.increment(); // 从 1 开始而不是 0
    }

    // ========== 修饰器 ==========
    
    /**
     * @dev 仅允许 Minter 合约调用
     */
    modifier onlyMinter() {
        require(msg.sender == minterContract, "Caller is not the minter contract");
        _;
    }

    // ========== 管理员函数 ==========
    
    /**
     * @notice 设置授权的 Minter 合约地址
     * @dev 仅合约所有者可调用
     * @param _minter Minter 合约地址
     */
    function setMinterContract(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        address oldMinter = minterContract;
        minterContract = _minter;
        emit MinterContractUpdated(oldMinter, _minter);
    }

    /**
     * @notice 设置 NFT 元数据的基础 URI
     * @dev 仅合约所有者可调用，用于设置 IPFS 或服务器地址
     * @param baseURI 基础 URI（例如：ipfs://QmXxx/ 或 https://api.example.com/metadata/）
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    // ========== 核心功能函数 ==========
    
    /**
     * @notice 铸造新的 NFT
     * @dev 仅 Minter 合约可调用此函数
     * @param to 接收 NFT 的用户地址
     * @return tokenId 新铸造的 Token ID
     */
    function mint(address to) external onlyMinter returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        // 获取当前 Token ID 并铸造
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        
        // 自增 Token ID 计数器
        _tokenIdCounter.increment();
        
        // 记录用户拥有的 Token ID（在 _update 中自动处理）
        // tokensOfOwner[to].push(tokenId); // 已在 _update 中处理，无需重复
        
        emit Minted(to, tokenId);
        return tokenId;
    }

    /**
     * @dev 重写 _update 函数以同步 tokensOfOwner 映射
     * @notice 在 NFT 转移（包括铸造和销毁）时自动更新所有权记录
     * @param to 目标地址
     * @param tokenId Token ID
     * @param auth 授权地址
     * @return from 原持有者地址
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override 
        returns (address) 
    {
        address from = super._update(to, tokenId, auth);
        
        // 从原持有者的列表中移除 tokenId
        if (from != address(0)) {
            uint256[] storage fromTokens = tokensOfOwner[from];
            uint256 length = fromTokens.length;
            
            for (uint256 i = 0; i < length; i++) {
                if (fromTokens[i] == tokenId) {
                    // 将最后一个元素移到当前位置，然后删除最后一个元素
                    fromTokens[i] = fromTokens[length - 1];
                    fromTokens.pop();
                    break;
                }
            }
        }
        
        // 添加到新持有者的列表中
        if (to != address(0)) {
            tokensOfOwner[to].push(tokenId);
        }
        
        return from;
    }

    // ========== 查询函数 ==========
    
    /**
     * @notice 获取用户拥有的所有 Token ID
     * @param owner 用户地址
     * @return 该用户拥有的所有 Token ID 数组
     */
    function getTokensOfOwner(address owner) external view returns (uint256[] memory) {
        return tokensOfOwner[owner];
    }

    /**
     * @notice 获取当前 Token ID 编号
     * @dev 表示下一个将要铸造的 Token ID
     * @return 当前计数器值
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice 获取已铸造的 NFT 总数
     * @return 已铸造的 NFT 数量
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current() - 1; // 因为从 1 开始计数
    }

    /**
     * @notice 获取 NFT 的元数据 URI
     * @dev 重写 ERC721 的 tokenURI 函数
     * @param tokenId Token ID
     * @return 完整的元数据 URI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        // 如果没有设置 baseURI，返回空字符串
        if (bytes(_baseTokenURI).length == 0) {
            return "";
        }
        
        // 拼接 baseURI + tokenId
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    /**
     * @dev 重写 supportsInterface 以支持 ERC721 接口
     * @param interfaceId 接口 ID
     * @return 是否支持该接口
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}