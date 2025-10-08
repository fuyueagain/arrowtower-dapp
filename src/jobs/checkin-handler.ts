// src/jobs/checkin-handler.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { addToMintQueue } from '@/jobs/mint-processor'; // ✅ 新的导入

const prisma = new PrismaClient();
const processed = new Set<string>();

export async function handleCheckinApproval(userId: string, routeId: string): Promise<void> {
  const taskKey = `${userId}:${routeId}`;

  if (processed.has(taskKey)) {
    logger.info(`⏭️ 已处理过用户 ${userId} 的路线 ${routeId}，跳过`);
    return;
  }

  try {
    const completedPOIs = await prisma.checkin.count({
      where: { userId, routeId, status: 'approved' },
    });

    const totalPOIs = await prisma.pOI.count({ where: { routeId } });

    if (completedPOIs < totalPOIs) {
      logger.debug(`📌 用户 ${userId} 尚未完成路线 ${routeId}: ${completedPOIs}/${totalPOIs}`);
      return;
    }

    logger.info(`🎉 用户 ${userId} 已完成路线 ${routeId}，准备铸造 NFT`);

    const voucher = await prisma.voucher.create({
      data: { userId, routeId, status: 'pending' },
    });

    logger.info(`🎫 凭证已创建: ${voucher.id}，加入内存队列...`);
    
    // ✅ 改成调用内存队列
    await addToMintQueue(voucher.id);

    processed.add(taskKey);
  } catch (error) {
    logger.error(`❌ 处理用户 ${userId} 路线 ${routeId} 时出错:`, error);
  }
}