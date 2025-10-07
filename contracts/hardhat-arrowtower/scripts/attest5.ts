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
  const nftBaseURI = "https://arrowtower.example.com/metadata/";
  
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

  // ========================================
  // 阶段 4: 生成测试用户
  // ========================================
  console.log("=====================================");
  console.log("👥 阶段 4: 生成测试用户");
  console.log("=====================================\n");
  
  const walletCount = 5;
  const wallets: { wallet: any; privateKey: string }[] = [];
  const addresses: string[] = [];

  for (let i = 0; i < walletCount; i++) {
    const tmpWallet = ethers.Wallet.createRandom();
    const wallet = new ethers.Wallet(tmpWallet.privateKey, ethers.provider);
    addresses.push(wallet.address);
    wallets.push({ wallet, privateKey: tmpWallet.privateKey });
  }

  console.log(`✅ 生成了 ${walletCount} 个测试用户:\n`);
  wallets.forEach((item, i) => {
    console.log(`   [用户 ${i + 1}]`);
    console.log(`   地址: ${item.wallet.address}`);
    console.log(`   私钥: ${item.privateKey}\n`);
  });

  // ========================================
  // 阶段 5: 分发 ETH 到测试账户
  // ========================================
  console.log("=====================================");
  console.log("💰 阶段 5: 分发测试 ETH");
  console.log("=====================================\n");
  
  for (const [i, item] of wallets.entries()) {
    await owner.sendTransaction({ 
      to: item.wallet.address, 
      value: ethers.parseEther("0.1") 
    });
    console.log(`✓ 用户 ${i + 1} 已收到 0.1 ETH`);
  }
  console.log("✅ ETH 分发完成\n");

  // ========================================
  // 阶段 6: 测试独立部署的合约 - 批量操作
  // ========================================
  console.log("=====================================");
  console.log("🧪 阶段 6: 测试独立部署的合约 - 批量操作");
  console.log("=====================================");
  console.log("使用独立部署的 NFT 和 Minter 合约\n");
  
  console.log("正在批量完成游览并铸造 NFT...");
  const batchTx = await standaloneMinter.batchCompleteTourAndMint(addresses);
  await batchTx.wait();
  console.log("✅ 批量操作完成\n");

  // ========================================
  // 阶段 7: 验证独立合约批量铸造结果
  // ========================================
  console.log("=====================================");
  console.log("✅ 阶段 7: 验证独立合约批量铸造结果");
  console.log("=====================================\n");
  
  for (let i = 0; i < wallets.length; i++) {
    const item = wallets[i];
    const tokenId = i + 1;
    
    try {
      const nftOwner = await standaloneNFT.ownerOf(tokenId);
      const userStatus = await standaloneMinter.getUserStatus(item.wallet.address);
      const tokenURI = await standaloneNFT.tokenURI(tokenId);
      
      console.log(`📌 用户 ${i + 1}:`);
      console.log(`   地址: ${item.wallet.address}`);
      console.log(`   拥有 NFT: #${tokenId}`);
      console.log(`   持有者验证: ${nftOwner === item.wallet.address ? "✓ 正确" : "✗ 错误"}`);
      console.log(`   已完成游览: ${userStatus.completedTour ? "✓" : "✗"}`);
      console.log(`   已铸造 NFT: ${userStatus.minted ? "✓" : "✗"}`);
      console.log(`   完成时间: ${new Date(Number(userStatus.completionTime) * 1000).toLocaleString()}`);
      console.log(`   Token URI: ${tokenURI}`);
      console.log("");
      
    } catch (err) {
      console.error(`❌ 用户 ${i + 1} 验证失败:`, err);
      console.log("");
    }
  }

  // ========================================
  // 阶段 8: 测试独立合约单个用户流程
  // ========================================
  console.log("=====================================");
  console.log("🧪 阶段 8: 测试独立合约单个用户流程");
  console.log("=====================================");
  console.log("测试内容: 分步完成游览和铸造\n");
  
  const singleWallet = ethers.Wallet.createRandom();
  const singleUser = new ethers.Wallet(singleWallet.privateKey, ethers.provider);
  
  await owner.sendTransaction({ 
    to: singleUser.address, 
    value: ethers.parseEther("0.1") 
  });
  
  console.log(`新用户地址: ${singleUser.address}`);
  console.log(`新用户私钥: ${singleWallet.privateKey}\n`);
  
  // 步骤 1: 完成游览
  console.log("步骤 1: 标记游览完成...");
  await standaloneMinter.completeTour(singleUser.address);
  console.log("✅ 游览完成\n");
  
  // 验证状态
  let status = await standaloneMinter.getUserStatus(singleUser.address);
  console.log("当前状态:");
  console.log(`   已完成游览: ${status.completedTour}`);
  console.log(`   已铸造 NFT: ${status.minted}\n`);
  
  // 步骤 2: 铸造 NFT
  console.log("步骤 2: 铸造 NFT...");
  await standaloneMinter.mintNFT(singleUser.address);
  console.log("✅ NFT 铸造成功\n");
  
  // 验证铸造结果
  const lastTokenId = await standaloneNFT.totalSupply();
  const lastOwner = await standaloneNFT.ownerOf(lastTokenId);
  status = await standaloneMinter.getUserStatus(singleUser.address);
  
  console.log("铸造验证:");
  console.log(`   NFT Token ID: #${lastTokenId}`);
  console.log(`   NFT 持有者: ${lastOwner}`);
  console.log(`   持有者匹配: ${lastOwner === singleUser.address ? "✓" : "✗"}`);
  console.log(`   已完成游览: ${status.completedTour}`);
  console.log(`   已铸造 NFT: ${status.minted}\n`);

  // ========================================
  // 阶段 9: 测试暂停功能
  // ========================================
  console.log("=====================================");
  console.log("🧪 阶段 9: 测试暂停功能");
  console.log("=====================================\n");
  
  console.log("测试 1: 暂停独立 Minter 合约...");
  await standaloneMinter.setPaused(true);
  const pausedStats1 = await standaloneMinter.getContractStats();
  console.log(`✅ 合约已暂停 (状态: ${pausedStats1.isPaused})\n`);
  
  console.log("测试 2: 尝试在暂停状态下操作...");
  const testWallet = ethers.Wallet.createRandom();
  try {
    await standaloneMinter.completeTour(testWallet.address);
    console.log("❌ 错误：暂停状态下不应该允许操作\n");
  } catch (err: any) {
    console.log("✅ 正确拒绝了暂停状态下的操作");
    console.log(`   错误信息: ${err.message.includes("paused") ? "Contract is paused" : err.message}\n`);
  }
  
  console.log("测试 3: 恢复合约...");
  await standaloneMinter.setPaused(false);
  const pausedStats2 = await standaloneMinter.getContractStats();
  console.log(`✅ 合约已恢复 (状态: ${pausedStats2.isPaused})\n`);

  // ========================================
  // 阶段 10: 测试用户铸造权限检查
  // ========================================
  console.log("=====================================");
  console.log("🧪 阶段 10: 测试用户铸造权限");
  console.log("=====================================\n");
  
  const checkWallet = ethers.Wallet.createRandom();
  
  console.log("检查 1: 未完成游览的用户");
  let [canMint, reason] = await standaloneMinter.canUserMint(checkWallet.address);
  console.log(`   可以铸造: ${canMint}`);
  console.log(`   原因: ${reason || "N/A"}\n`);
  
  console.log("检查 2: 已铸造过的用户");
  [canMint, reason] = await standaloneMinter.canUserMint(wallets[0].wallet.address);
  console.log(`   可以铸造: ${canMint}`);
  console.log(`   原因: ${reason || "N/A"}\n`);

  // ========================================
  // 阶段 11: 测试更新 NFT 合约地址
  // ========================================
  console.log("=====================================");
  console.log("🧪 阶段 11: 测试更新 NFT 合约地址");
  console.log("=====================================\n");
  
  console.log("部署新的 NFT 合约用于测试...");
  const newNFT = await ArrowTowerNFT.deploy(
    "New Arrow Tower",
    "NAT",
    "https://new.example.com/"
  );
  await newNFT.waitForDeployment();
  const newNFTAddr = await newNFT.getAddress();
  console.log(`新 NFT 合约地址: ${newNFTAddr}\n`);
  
  console.log("更新 Minter 的 NFT 合约地址...");
  await standaloneMinter.setNFTContract(newNFTAddr);
  const updatedNFTAddr = await standaloneMinter.nftContract();
  console.log(`✅ NFT 合约地址已更新`);
  console.log(`   更新验证: ${updatedNFTAddr === newNFTAddr ? "✓" : "✗"}\n`);
  
  console.log("恢复原 NFT 合约地址...");
  await standaloneMinter.setNFTContract(standaloneNFTAddr);
  console.log("✅ 已恢复原地址\n");

  // ========================================
  // 阶段 12: 测试重置用户状态
  // ========================================
  console.log("=====================================");
  console.log("🧪 阶段 12: 测试重置用户状态");
  console.log("=====================================\n");
  
  const resetUser = wallets[0].wallet.address;
  console.log(`目标用户: ${resetUser}`);
  
  let beforeStatus = await standaloneMinter.getUserStatus(resetUser);
  console.log("\n重置前状态:");
  console.log(`   已完成游览: ${beforeStatus.completedTour}`);
  console.log(`   已铸造 NFT: ${beforeStatus.minted}`);
  console.log(`   完成时间: ${beforeStatus.completionTime}\n`);
  
  console.log("执行重置...");
  await standaloneMinter.resetUserStatus(resetUser);
  
  let afterStatus = await standaloneMinter.getUserStatus(resetUser);
  console.log("\n重置后状态:");
  console.log(`   已完成游览: ${afterStatus.completedTour}`);
  console.log(`   已铸造 NFT: ${afterStatus.minted}`);
  console.log(`   完成时间: ${afterStatus.completionTime}`);
  console.log(`   重置验证: ${!afterStatus.completedTour && !afterStatus.minted ? "✓" : "✗"}\n`);

  // ========================================
  // 最终统计报告
  // ========================================
  console.log("\n\n=====================================");
  console.log("🎉 所有测试完成！");
  console.log("=====================================");
  
  const finalStandaloneStats = await standaloneMinter.getContractStats();
  const standaloneTotal = await standaloneNFT.totalSupply();
  
  console.log("\n📊 最终统计报告:");
  console.log("─────────────────────────────────────");
  
  console.log("\n【独立部署的合约】");
  console.log(`   ArrowTowerNFT: ${standaloneNFTAddr}`);
  console.log(`   └─ 名称: ${await standaloneNFT.name()}`);
  console.log(`   └─ 符号: ${await standaloneNFT.symbol()}`);
  console.log(`   └─ 总供应: ${standaloneTotal}`);
  console.log(`   ArrowTowerMinter: ${standaloneMinterAddr}`);
  console.log(`   └─ NFT 地址: ${await standaloneMinter.nftContract()}`);
  console.log(`   └─ 状态: ${finalStandaloneStats.isPaused ? "暂停" : "正常"}`);
  console.log(`   └─ 总铸造: ${finalStandaloneStats.totalMinted}`);
  
  console.log("\n【测试统计】");
  console.log(`   批量测试用户: ${wallets.length} 个`);
  console.log(`   单独测试用户: 1 个`);
  console.log(`   总测试用户: ${wallets.length + 1} 个`);
  
  console.log("\n【NFT 铸造统计】");
  console.log(`   总铸造: ${standaloneTotal} 个`);
  
  console.log("\n【合约地址汇总】");
  console.log(`   NFT: ${standaloneNFTAddr}`);
  console.log(`   Minter: ${standaloneMinterAddr}`);
  
  console.log("\n─────────────────────────────────────");
  console.log("✅ 所有功能测试通过！");
  console.log("=====================================\n");
  
  // 输出用于验证的 JSON 配置
/*   const deploymentInfo = {
    network: hre.network.name,
    deployer: owner.address,
    timestamp: new Date().toISOString(),
    contracts: {
      nft: standaloneNFTAddr,
      minter: standaloneMinterAddr
    },
    stats: {
      name: await standaloneNFT.name(),
      symbol: await standaloneNFT.symbol(),
      totalSupply: String(standaloneTotal),
      contractStats: finalStandaloneStats,
      testUsers: wallets.length + 1
    }
  };

  // 写入文件
  const outDir = path.resolve(process.cwd(), "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${hre.network.name}-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2), { encoding: "utf-8" });

  console.log(`部署信息已写入: ${outPath}`);
  console.log("部署信息 (摘要):");
  console.log(JSON.stringify({
    network: deploymentInfo.network,
    deployer: deploymentInfo.deployer,
    contracts: deploymentInfo.contracts
  }, null, 2));

  // 返回部署信息（方便脚本测试时 programmatic 使用）
  return deploymentInfo; */
} 

main().then(info => {
  // 如需 programmatic 使用部署信息，可在这里处理
  process.exitCode = 0;
}).catch((err) => {
  console.error("部署发生错误:", err);
  process.exitCode = 1;
});