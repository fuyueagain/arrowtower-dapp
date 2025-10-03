// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * 箭扣长城村 NFT 系统部署模块
 * 
 * 部署步骤：
 * 1. 部署 ArrowTowerVillageNFT 合约
 * 2. 部署 ArrowTowerMinter 合约（传入 NFT 合约地址）
 * 3. 设置 NFT 合约的 Minter 权限
 * 4. 可选：设置 NFT 的 baseURI
 */
const ArrowTowerModule = buildModule("ArrowTowerModule", (m) => {
  // ========== 可配置参数 ==========
  
  /**
   * NFT 元数据基础 URI（可选）
   * 例如：
   * - IPFS: "ipfs://QmYourHashHere/"
   * - HTTP: "https://api.yourdomain.com/metadata/"
   * 留空则后续通过 setBaseURI 设置
   */
  const baseURI = m.getParameter("baseURI", "");

  // ========== 第一步：部署 NFT 合约 ==========
  
  console.log("Deploying ArrowTowerVillageNFT contract...");
  
  const nftContract = m.contract("ArrowTowerVillageNFT", []);

  // ========== 第二步：部署 Minter 合约 ==========
  
  console.log("Deploying ArrowTowerMinter contract...");
  
  const minterContract = m.contract("ArrowTowerMinter", [nftContract]);

  // ========== 第三步：设置 Minter 权限 ==========
  
  console.log("Setting minter contract authorization...");
  
  /**
   * 调用 NFT 合约的 setMinterContract 函数
   * 授权 Minter 合约可以铸造 NFT
   */
  m.call(nftContract, "setMinterContract", [minterContract]);

  // ========== 第四步：设置 Base URI（如果提供） ==========
  
  if (baseURI) {
    console.log(`Setting base URI: ${baseURI}`);
    m.call(nftContract, "setBaseURI", [baseURI]);
  }

  // ========== 返回部署的合约实例 ==========
  
  return { 
    nftContract, 
    minterContract 
  };
});

export default ArrowTowerModule;