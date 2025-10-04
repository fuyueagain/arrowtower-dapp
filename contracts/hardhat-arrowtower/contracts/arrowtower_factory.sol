// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ArrowTowerNFTUpgradeable
 * @dev 可升级的箭塔村 NFT 合约
 */
contract ArrowTowerNFTUpgradeable is 
    Initializable, 
    ERC721Upgradeable, 
    OwnableUpgradeable 
{
    uint256 private _tokenIdCounter;
    address public minterContract;
    string private _baseTokenURI;
    mapping(address => uint256[]) private _tokensOfOwner;

    event Minted(address indexed to, uint256 indexed tokenId);
    event MinterContractUpdated(address indexed oldMinter, address indexed newMinter);
    event BaseURIUpdated(string newBaseURI);

    modifier onlyMinter() {
        require(msg.sender == minterContract, "Caller is not the minter contract");
        _;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address minter_
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(msg.sender);
        _baseTokenURI = baseURI_;
        minterContract = minter_;
        _tokenIdCounter = 1; // 从 1 开始
    }

    function mint(address to) external onlyMinter returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenIdCounter++;
        
        emit Minted(to, tokenId);
        return tokenId;
    }

    function _update(address to, uint256 tokenId, address auth) 
        internal 
        override 
        returns (address) 
    {
        address from = super._update(to, tokenId, auth);
        
        if (from != address(0)) {
            uint256[] storage fromTokens = _tokensOfOwner[from];
            uint256 length = fromTokens.length;
            for (uint256 i = 0; i < length; i++) {
                if (fromTokens[i] == tokenId) {
                    fromTokens[i] = fromTokens[length - 1];
                    fromTokens.pop();
                    break;
                }
            }
        }
        
        if (to != address(0)) {
            _tokensOfOwner[to].push(tokenId);
        }
        
        return from;
    }

    function setMinterContract(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        address oldMinter = minterContract;
        minterContract = _minter;
        emit MinterContractUpdated(oldMinter, _minter);
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }

    function getTokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _tokensOfOwner[owner];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        if (bytes(_baseTokenURI).length == 0) {
            return "";
        }
        
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId)));
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

/**
 * @title ArrowTowerMinterUpgradeable
 * @dev 可升级的铸造器合约
 */
contract ArrowTowerMinterUpgradeable is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    ArrowTowerNFTUpgradeable public nftContract;
    
    mapping(address => bool) public hasCompletedTour;
    mapping(address => bool) public hasMinted;
    mapping(address => uint256) public tourCompletionTime;
    bool public paused;

    event TourCompleted(address indexed user, uint256 timestamp);
    event NFTMinted(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    event PausedStatusChanged(bool isPaused);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function initialize(address _nftContract) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = ArrowTowerNFTUpgradeable(_nftContract);
    }

    function completeTour(address user) external onlyOwner whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(!hasCompletedTour[user], "User already completed tour");
        
        hasCompletedTour[user] = true;
        tourCompletionTime[user] = block.timestamp;
        
        emit TourCompleted(user, block.timestamp);
    }

    function batchCompleteTour(address[] calldata users) external onlyOwner whenNotPaused {
        uint256 length = users.length;
        require(length > 0 && length <= 100, "Invalid user array length");
        
        for (uint256 i = 0; i < length; i++) {
            address user = users[i];
            if (user == address(0) || hasCompletedTour[user]) continue;
            
            hasCompletedTour[user] = true;
            tourCompletionTime[user] = block.timestamp;
            emit TourCompleted(user, block.timestamp);
        }
    }

    function mintNFT(address user) external onlyOwner whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        require(hasCompletedTour[user], "User has not completed tour");
        require(!hasMinted[user], "User already minted NFT");
        
        hasMinted[user] = true;
        uint256 tokenId = nftContract.mint(user);
        
        emit NFTMinted(user, tokenId, block.timestamp);
    }

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

    function batchCompleteTourAndMint(address[] calldata users) 
        external 
        onlyOwner 
        whenNotPaused 
        nonReentrant 
    {
        uint256 length = users.length;
        require(length > 0 && length <= 50, "Invalid user array length");
        
        for (uint256 i = 0; i < length; i++) {
            address user = users[i];
            if (user == address(0) || hasCompletedTour[user] || hasMinted[user]) continue;
            
            hasCompletedTour[user] = true;
            tourCompletionTime[user] = block.timestamp;
            emit TourCompleted(user, block.timestamp);
            
            hasMinted[user] = true;
            uint256 tokenId = nftContract.mint(user);
            emit NFTMinted(user, tokenId, block.timestamp);
        }
    }

    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        address oldContract = address(nftContract);
        nftContract = ArrowTowerNFTUpgradeable(_nftContract);
        emit NFTContractUpdated(oldContract, _nftContract);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStatusChanged(_paused);
    }

    function resetUserStatus(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        hasCompletedTour[user] = false;
        hasMinted[user] = false;
        tourCompletionTime[user] = 0;
    }

    function canUserMint(address user) 
        external 
        view 
        returns (bool canMint, string memory reason) 
    {
        if (paused) return (false, "Contract is paused");
        if (user == address(0)) return (false, "Invalid user address");
        if (!hasCompletedTour[user]) return (false, "User has not completed tour");
        if (hasMinted[user]) return (false, "User already minted NFT");
        return (true, "");
    }

    function getUserStatus(address user) 
        external 
        view 
        returns (bool completedTour, bool minted, uint256 completionTime) 
    {
        return (hasCompletedTour[user], hasMinted[user], tourCompletionTime[user]);
    }

    function getContractStats() 
        external 
        view 
        returns (uint256 totalMinted, bool isPaused, address nftAddress) 
    {
        return (nftContract.totalSupply(), paused, address(nftContract));
    }
}

/**
 * @title ArrowTowerFactory
 * @dev 工厂合约：一键部署完整的箭塔村 NFT 项目
 */
contract ArrowTowerFactory {
    struct ProjectInfo {
        address nft;
        address minter;
        address owner;
        uint256 createdAt;
        bool exists;
    }

    // projectId => ProjectInfo
    mapping(bytes32 => ProjectInfo) public projects;
    
    // 记录所有项目 ID（便于遍历）
    bytes32[] public projectIds;
    
    // 记录某个地址创建的所有项目
    mapping(address => bytes32[]) public ownerProjects;

    event ProjectDeployed(
        bytes32 indexed projectId,
        address indexed owner,
        address nftContract,
        address minterContract,
        uint256 timestamp
    );

    /**
     * @notice 创建新项目（部署 NFT + Minter）
     * @param projectId 项目唯一标识符
     * @param nftName NFT 名称
     * @param nftSymbol NFT 符号
     * @param baseURI 元数据基础 URI
     * @return nftAddr NFT 合约地址
     * @return minterAddr Minter 合约地址
     */
    function createProject(
        bytes32 projectId,
        string memory nftName,
        string memory nftSymbol,
        string memory baseURI
    ) 
        external 
        returns (address nftAddr, address minterAddr) 
    {
        require(!projects[projectId].exists, "Project ID already exists");
        require(bytes(nftName).length > 0, "Empty NFT name");
        require(bytes(nftSymbol).length > 0, "Empty NFT symbol");

        // 1. 部署 NFT 合约（先传 address(0) 作为 minter 占位）
        bytes memory nftCode = type(ArrowTowerNFTUpgradeable).creationCode;
        address nftContract;
        assembly {
            nftContract := create(0, add(nftCode, 0x20), mload(nftCode))
        }
        require(nftContract != address(0), "NFT deployment failed");
        
        // 初始化 NFT（minter 暂时为 address(0)）
        ArrowTowerNFTUpgradeable(nftContract).initialize(
            nftName, 
            nftSymbol, 
            baseURI,
            address(0)
        );

        // 2. 部署 Minter 合约
        bytes memory minterCode = type(ArrowTowerMinterUpgradeable).creationCode;
        address minterContract;
        assembly {
            minterContract := create(0, add(minterCode, 0x20), mload(minterCode))
        }
        require(minterContract != address(0), "Minter deployment failed");
        
        // 初始化 Minter
        ArrowTowerMinterUpgradeable(minterContract).initialize(nftContract);

        // 3. 绑定 Minter 到 NFT
        ArrowTowerNFTUpgradeable(nftContract).setMinterContract(minterContract);

        // 4. 转移所有权给调用者
        ArrowTowerNFTUpgradeable(nftContract).transferOwnership(msg.sender);
        ArrowTowerMinterUpgradeable(minterContract).transferOwnership(msg.sender);

        // 5. 记录项目信息
        projects[projectId] = ProjectInfo({
            nft: nftContract,
            minter: minterContract,
            owner: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        projectIds.push(projectId);
        ownerProjects[msg.sender].push(projectId);

        emit ProjectDeployed(
            projectId, 
            msg.sender, 
            nftContract, 
            minterContract, 
            block.timestamp
        );

        return (nftContract, minterContract);
    }

    /**
     * @notice 获取项目信息
     */
    function getProject(bytes32 projectId) 
        external 
        view 
        returns (
            address nft,
            address minter,
            address owner,
            uint256 createdAt,
            bool exists
        ) 
    {
        ProjectInfo memory info = projects[projectId];
        return (info.nft, info.minter, info.owner, info.createdAt, info.exists);
    }

    /**
     * @notice 获取某个地址创建的所有项目
     */
    function getOwnerProjects(address owner) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return ownerProjects[owner];
    }

    /**
     * @notice 获取所有项目 ID
     */
    function getAllProjectIds() external view returns (bytes32[] memory) {
        return projectIds;
    }

    /**
     * @notice 获取项目总数
     */
    function getProjectCount() external view returns (uint256) {
        return projectIds.length;
    }
}