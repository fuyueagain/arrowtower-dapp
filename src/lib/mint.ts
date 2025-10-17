// src/lib/mint.ts
// 用法: npx ts-node src/lib/mint.ts 0x...
// 功能: Owner 为指定用户完成旅游并铸造 NFT

import { createWalletClient, createPublicClient, http, type Address, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import { passetHub } from './chains/passetHub.ts'; // ✅ 确保路径正确

dotenv.config();

// ✅ 强制读取环境变量
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MINTER_CONTRACT;

if (!PRIVATE_KEY) throw new Error('❌ 缺少 PRIVATE_KEY 环境变量');
if (!CONTRACT_ADDRESS) throw new Error('❌ 缺少 CONTRACT_ADDRESS 环境变量');

// ✅ 断言类型
const privateKey = PRIVATE_KEY as `0x${string}`;
const contractAddress = CONTRACT_ADDRESS as Address;

// 🔧 ABI 定义 (基于合约实际 ABI)
const minterAbi = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'completeTourAndMint',
    outputs: [],
    stateMutability: 'nonpayable',
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
  // ✅ 使用合约实际的 NFTMinted 事件
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'NFTMinted',
    type: 'event',
  },
  // ✅ 保留 Transfer 事件作为备用
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
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
      return { tokenId: '', txHash: '' }; // 表示无需铸造
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
    });

    console.log('✅ 交易已发送！哈希:', hash);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('🎉 成功！NFT 已为用户铸造！');
    console.log('📝 交易哈希:', receipt.transactionHash);
    console.log('💸 燃烧 Gas:', receipt.gasUsed.toString());

    // ✅ 调试：打印完整日志
    console.log('\n📋 === 开始打印 receipt.logs ===');
    console.log(JSON.stringify(
      receipt.logs,
      (key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    ));
    console.log('=== 结束打印 receipt.logs ===\n');

    // ✅ 优先解析 NFTMinted 事件（合约直接触发）
    let tokenId = '';
    
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: minterAbi,
          data: log.data,
          topics: log.topics,
        });

        // 🎯 优先检查 NFTMinted 事件
        if (decoded.eventName === 'NFTMinted') {
          const { user, tokenId: tid, timestamp } = decoded.args;
          
          console.log(`🎁 NFTMinted 事件: user=${user}, tokenId=${tid}, timestamp=${timestamp}`);
          
          // 验证用户地址匹配
          if (user.toLowerCase() === targetUser.toLowerCase()) {
            tokenId = tid.toString();
            console.log('✅ 成功从 NFTMinted 事件获取 tokenId:', tokenId);
            break;
          }
        }
        
        // 🔄 备用：如果 NFTMinted 未找到，尝试 Transfer 事件
        if (!tokenId && decoded.eventName === 'Transfer') {
          const { from, to, tokenId: tid } = decoded.args;
          
          console.log(`🔍 Transfer 事件: ${from} → ${to}, tokenId: ${tid}`);
          
          // 判断是否是 mint (from == 0x0) 且发送给目标用户
          if (
            from === '0x0000000000000000000000000000000000000000' &&
            to.toLowerCase() === targetUser.toLowerCase()
          ) {
            tokenId = tid.toString();
            console.log('✅ 从 Transfer 事件获取 tokenId:', tokenId);
          }
        }
      } catch (e) {
        // 忽略无法解码的日志（可能是其他合约的事件）
        continue;
      }
    }

    if (!tokenId) {
      console.warn('⚠️ 未找到 NFTMinted 或 Transfer 事件');
    } else {
      console.log('🎉 最终 tokenId:', tokenId);
    }

    // ✅ 验证最终状态
    const finalStatus = await publicClient.readContract({
      address: contractAddress,
      abi: minterAbi,
      functionName: 'getUserStatus',
      args: [targetUser],
    });
    console.log('✅ 最终状态 - 已完成:', finalStatus[0], '已铸造:', finalStatus[1]);

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
/* if (import.meta.url === `file://${process.argv[1]}`) */ {
  main().catch((error) => {
    console.error('❌ 未捕获异常:', error);
    process.exit(1);
  });
}

// ✅ 支持 import { mintForUser } 和 import mintForUser from './mint'
export default mintForUser;