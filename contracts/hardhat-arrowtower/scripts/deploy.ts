import hre from "hardhat";
import { ethers } from "hardhat";
import * as fs from "fs";
import path from "path";

async function main() {
  const [owner] = await ethers.getSigners();
  console.log("=====================================");
  console.log("🚀 箭塔村 NFT 项目部署脚本 (独立版本)");
  console.log("=====================================");
  console.log("部署者地址:", owner.address);
  console.log("部署者余额:", ethers.formatEther(await ethers.provider.getBalance(owner.address)), "ETH\n");

  // ========================================
  // 阶段 1: 独立部署 NFT 合约（完整参数）
  // ========================================
  console.log("=====================================");
  console.log("📦 阶段 1: 独立部署 ArrowTowerNFT 合约");
  console.log("=====================================");
  
  const nftName = "Arrow Tower Village NFT";
  const nftSymbol = "ATVNFT";
  const nftBaseURI = "https://arrowtower.netlify.app/metadata/";
  
  console.log("NFT 配置参数:");
  console.log(`   名称: ${nftName}`);
  console.log(`   符号: ${nftSymbol}`);
  console.log(`   基础URI: ${nftBaseURI}`);
  console.log("\n正在部署...");
  
  const ArrowTowerNFT = await ethers.getContractFactory("ArrowTowerNFT");
  const standaloneNFT = await ArrowTowerNFT.deploy(nftName, nftSymbol, nftBaseURI);
  await standaloneNFT.waitForDeployment();
  const standaloneNFTAddr = await standaloneNFT.getAddress();
  
  console.log("✅ ArrowTowerNFT 部署成功");
  console.log("   合约地址:", standaloneNFTAddr);
  console.log("   状态: 已初始化并可用\n");

  // 验证 NFT 基础信息
  const nftNameCheck = await standaloneNFT.name();
  const nftSymbolCheck = await standaloneNFT.symbol();
  const nftTotalSupply = await standaloneNFT.totalSupply();
  
  console.log("NFT 合约验证:");
  console.log(`   名称匹配: ${nftNameCheck === nftName ? "✓" : "✗"}`);
  console.log(`   符号匹配: ${nftSymbolCheck === nftSymbol ? "✓" : "✗"}`);
  console.log(`   初始供应量: ${nftTotalSupply}\n`);

  // ========================================
  // 阶段 2: 独立部署 Minter 合约（完整参数）
  // ========================================
  console.log("=====================================");
  console.log("📦 阶段 2: 独立部署 ArrowTowerMinter 合约");
  console.log("=====================================");
  
  console.log("Minter 配置参数:");
  console.log(`   NFT 合约地址: ${standaloneNFTAddr}`);
  console.log("\n正在部署...");
  
  const ArrowTowerMinter = await ethers.getContractFactory("ArrowTowerMinter");
  const standaloneMinter = await ArrowTowerMinter.deploy(standaloneNFTAddr);
  await standaloneMinter.waitForDeployment();
  const standaloneMinterAddr = await standaloneMinter.getAddress();
  
  console.log("✅ ArrowTowerMinter 部署成功");
  console.log("   合约地址:", standaloneMinterAddr);
  console.log("   状态: 已初始化并可用\n");

  // 验证 Minter 基础信息
  const minterNFTAddr = await standaloneMinter.nftContract();
  const minterPaused = await standaloneMinter.paused();
  
  console.log("Minter 合约验证:");
  console.log(`   NFT 地址匹配: ${minterNFTAddr === standaloneNFTAddr ? "✓" : "✗"}`);
  console.log(`   暂停状态: ${minterPaused}`);
  console.log(`   所有者: ${await standaloneMinter.owner()}\n`);

  // ========================================
  // 阶段 3: 绑定 NFT 和 Minter 合约
  // ========================================
  console.log("=====================================");
  console.log("🔗 阶段 3: 绑定 NFT 和 Minter 合约");
  console.log("=====================================\n");
  
  console.log("设置 Minter 为 NFT 的授权铸造者...");
  const setMinterTx = await standaloneNFT.setMinterContract(standaloneMinterAddr);
  await setMinterTx.wait();
  
  const currentMinter = await standaloneNFT.minterContract();
  console.log("✅ Minter 绑定成功");
  console.log(`   当前 Minter: ${currentMinter}`);
  console.log(`   绑定验证: ${currentMinter === standaloneMinterAddr ? "✓" : "✗"}\n`);


  console.log("\n─────────────────────────────────────");
  console.log("✅ 部署完成");
  console.log("=====================================\n");
  
} 

main().then(info => {
  // 如需 programmatic 使用部署信息，可在这里处理
  process.exitCode = 0;
}).catch((err) => {
  console.error("部署发生错误:", err);
  process.exitCode = 1;
});