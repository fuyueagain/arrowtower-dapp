// src/lib/owner-complete-tour.ts

import { createWalletClient,createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import { passetHub } from './chains/passetHub.ts';

dotenv.config();

const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MINTER_CONTRACT;
const USER_ADDRESS = process.env.USER_ADDRESS　as `0x${string}`;

const abi = [
  {
    inputs: [{ name: 'user', type: 'address' }] as const,
    name: 'completeTour',
    outputs: [] as const,
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

async function runCompleteTour() {
  console.log('🔍 正在加载 Owner 配置...');

  if (!OWNER_PRIVATE_KEY) throw new Error('❌ 缺少 OWNER_PRIVATE_KEY，请检查 .env 文件');
  if (!CONTRACT_ADDRESS) throw new Error('❌ 缺少 CONTRACT_ADDRESS，请检查 .env 文件');
  if (!USER_ADDRESS) throw new Error('❌ 缺少 USER_ADDRESS，请检查 .env 文件');

  // 验证地址格式
  if (!/^0x[a-fA-F0-9]{40}$/.test(USER_ADDRESS)) {
    throw new Error('❌ USER_ADDRESS 格式无效');
  }

  const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY as `0x${string}`);
  console.log('✅ Owner 钱包地址:', ownerAccount.address);
  console.log('🎯 目标用户地址:', USER_ADDRESS);
  console.log('📝 即将调用 completeTour(...)');

  const walletClient = createWalletClient({
    account: ownerAccount,
    chain: passetHub,
    transport: http(),
  });

  try {
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi,
      functionName: 'completeTour',
      args: [USER_ADDRESS],
    });

    console.log('✅ 交易已发送！哈希:', hash);

    const publicClient = createPublicClient({
      chain: passetHub,
      transport: http(),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('🎉 成功！用户已完成游览，交易回执:', receipt.transactionHash);
  } catch (error: any) {
    console.error('❌ 操作失败:', error.shortMessage || error.message);
    if (error.cause) {
      console.error('详细原因:', error.cause);
    }
  }
}

runCompleteTour().catch(console.error);