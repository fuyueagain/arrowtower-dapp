// src/jobs/mint-processor.ts

import { PrismaClient } from '@prisma/client';
import { mintForUser } from '@/lib/mint';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// ✅ 内存队列（保存 voucherId）
const mintQueue: string[] = [];
let isProcessing = false;

// ✅ 模拟异步处理器（后台持续消费）
async function startWorker() {
  if (isProcessing) return;
  isProcessing = true;

  logger.info('✅ 内存队列处理器已启动');

  while (mintQueue.length > 0) {
    const voucherId = mintQueue.shift()!; // 取出第一个任务
    await processMintTask(voucherId);
  }

  isProcessing = false;
}

// ✅ 处理单个铸造任务
async function processMintTask(voucherId: string) {
  logger.info(`⚙️ 开始处理铸造任务: ${voucherId}`);

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { user: true },
    });

    if (!voucher) {
      logger.warn(`⚠️ 凭证不存在: ${voucherId}`);
      return;
    }

    if (voucher.status !== 'pending') {
      logger.warn(`⚠️ 凭证状态不是 pending，当前状态: ${voucher.status}`);
      return;
    }

    // 🚀 调用你的铸造函数
    const result = await mintForUser(voucher.user.walletAddress as `0x${string}`);

    console.log('mintForUser铸造函数result : ',result);

    // ✅ 更新凭证状态
    await prisma.voucher.update({
      where: { id: voucherId },
      data: {
        status: 'minted',
        nftTokenId: result?.tokenId || null,
        mintTxHash: result?.txHash || null,
      },
    });

    logger.info(`✅ NFT 铸造成功: 用户 ${voucher.userId}, 凭证 ${voucherId}`);
  } catch (error) {
    logger.error(`❌ 铸造失败 (凭证: ${voucherId}):${error}`);

    await prisma.voucher.update({
      where: { id: voucherId },
      data: { status: 'failed' },
    });
  }
}

// ✅ 导出一个函数用于添加任务
export async function addToMintQueue(voucherId: string) {
  mintQueue.push(voucherId);
  logger.debug(`📥 已加入内存队列: ${voucherId} (队列长度: ${mintQueue.length})`);

  // 立即尝试处理（异步触发）
  void startWorker();
}

// ✅ 可选：导出队列状态（用于调试）
export function getMintQueueStatus() {
  return {
    queueLength: mintQueue.length,
    isProcessing,
  };
}