// src/lib/mint.ts
// 用法: npx ts-node src/lib/mint.ts 0x...
// 功能: Owner 为指定用户完成旅游并铸造 NFT

import { createWalletClient, createPublicClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import { passetHub } from './chains/passetHub.ts'; // ✅ 确保路径正确

dotenv.config();

// ✅ 强制读取环境变量
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

if (!PRIVATE_KEY) throw new Error('❌ 缺少 PRIVATE_KEY 环境变量');
if (!CONTRACT_ADDRESS) throw new Error('❌ 缺少 CONTRACT_ADDRESS 环境变量');

// ✅ 断言类型
const privateKey = PRIVATE_KEY as `0x${string}`;
const contractAddress = CONTRACT_ADDRESS as Address;

// 🔧 ABI 定义
const minterAbi = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'completeTourAndMint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserStatus',
    outputs: [
      { name: 'completedTour', type: 'bool' },
      { name: 'minted', type: 'bool' },
      { name: 'completionTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * ✅ 核心函数：为指定用户完成旅游并铸造 NFT
 * 可被其他模块导入使用（如 BullMQ worker）
 */
export async function mintForUser(targetUser: Address): Promise<{ tokenId: string; txHash: string }> {
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: passetHub,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: passetHub,
    transport: http(),
  });

  console.log('✅ Owner 钱包地址:', account.address);
  console.log('🌍 使用链:', passetHub.name);
  console.log('🎯 目标用户地址:', targetUser);

  // 🔍 查询用户状态
  try {
    const status = await publicClient.readContract({
      address: contractAddress,
      abi: minterAbi,
      functionName: 'getUserStatus',
      args: [targetUser],
    });

    console.log('📋 用户当前状态:');
    console.log(`   已完成游览: ${status[0]}`);
    console.log(`   已铸造 NFT: ${status[1]}`);
    console.log(`   完成时间戳: ${status[2]}`);

    if (status[0] && status[1]) {
      console.log('🎉 该用户已完成游览并已铸造 NFT！');
      return { tokenId: '',txHash: '' }; // 表示无需铸造
    }
  } catch (error) {
    console.error('❌ 查询用户状态失败:', error);
    throw error;
  }

  // ✅ 执行铸造
  console.log(`🚀 正在为用户 ${targetUser} 执行 completeTourAndMint...`);
  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: minterAbi,
      functionName: 'completeTourAndMint',
      args: [targetUser],
      value: BigInt(0),
    });

    console.log('✅ 交易已发送！哈希:', hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('🎉 成功！NFT 已为用户铸造！');
    console.log('📝 交易哈希:', receipt.transactionHash);
    console.log('💸 燃烧 Gas:', receipt.gasUsed.toString());

    // ✅ 验证最终状态
    const finalStatus = await publicClient.readContract({
      address: contractAddress,
      abi: minterAbi,
      functionName: 'getUserStatus',
      args: [targetUser],
    });
    console.log('✅ 最终状态 - 已完成:', finalStatus[0], '已铸造:', finalStatus[1]);

    // 🔍 解析日志，获取 tokenId
    // 假设 NFTMinted 事件是合约中唯一的事件，且第一个 topic 是事件签名
    const nftMintedEvent = receipt.logs.find((log) => {
      // 事件签名: NFTMinted(address,uint256,uint256)
      const eventSignature =
        '0x339d417733730d857958763842516423238140749e277782e47d10107251f8f9';
      return log.topics[0] === eventSignature;
    });

    let tokenId = '';
    if (nftMintedEvent) {
      // tokenId 是第二个 indexed 参数，位于 topics[2]
      tokenId = nftMintedEvent.topics[2] || '';
      console.log('🎁 铸造的 tokenId:', tokenId);
    } else {
      console.warn('⚠️ 未找到 NFTMinted 事件，可能 ABI 或事件名不匹配');
    }

    // ✅ 返回 tokenId 和 txHash
    return { tokenId, txHash: receipt.transactionHash };
  } catch (error: any) {
    console.error('❌ 铸造失败:', error.message || error);
    if (error.shortMessage) console.error('📝 错误详情:', error.shortMessage);
    if (error.cause) console.error('🔍 原始错误:', error.cause);
    throw error; // ⚠️ 必须抛出，让 worker 捕获
  }
}

/**
 * 🚀 命令行主函数
 * 仅在直接运行此文件时执行
 */
async function main() {
  const userAddress = process.argv[2];

  if (!userAddress) {
    console.log('📌 用法: npx ts-node src/lib/mint.ts <用户地址>');
    console.log('📌 示例: npx ts-node src/lib/mint.ts 0x1234567890123456789012345678901234567890');
    process.exit(1);
  }

  try {
    // ✅ 简单验证地址格式
    if (!userAddress.startsWith('0x') || userAddress.length !== 42) {
      throw new Error(`无效的以太坊地址: ${userAddress}`);
    }
    const targetUser = userAddress as Address;

    await mintForUser(targetUser);
  } catch (error: any) {
    console.error('❌ 执行失败:', error.message || error);
    process.exit(1);
  }
}

// ✅ ✅ ESM 安全的 "if require.main === module"
// 只有当直接运行此文件时才执行 main()
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ 未捕获异常:', error);
    process.exit(1);
  });
}

// ✅ 支持 import { mintForUser } 和 import mintForUser from './mint'
export default mintForUser;