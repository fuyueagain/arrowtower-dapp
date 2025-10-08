// src/jobs/checkin-watcher.ts

import { PrismaClient } from '@prisma/client'; // ✅ 直接导入 PrismaClient
import { mintQueue } from './mint-processor.ts'; // 确保 mintQueue 已导出
import { logger } from '../lib/logger.ts';

console.log('✅ [Check-in Watcher] 已启动，正在监听打卡记录...');
setInterval(() => {
  console.log('🔄 [Check-in Watcher] 正在轮询数据库...');
}, 5000);

// 创建 Prisma 客户端实例
const prisma = new PrismaClient();

// 轮询间隔：30 秒
const POLLING_INTERVAL = 30_000;

// 缓存已处理的用户-路线组合，避免重复铸造
const processed = new Set<string>();

async function checkNewCheckins() {
  logger.info('🔍 开始检查新打卡记录...');

  try {
    // 获取最近 1 分钟内新批准的打卡
    const recentCheckins = await prisma.checkin.findMany({
      where: {
        status: 'approved',        
      },
      select: {
        userId: true,
        routeId: true,
      },
    });

    // 去重：用户 + 路线
    const tasks = Array.from(
      new Set(recentCheckins.map(c => `${c.userId}:${c.routeId}`))
    );

    for (const task of tasks) {
      const [userId, routeId] = task.split(':');

      // 跳过已处理的
      if (processed.has(task)) {
        continue;
      }

      try {
        const isCompleted = await checkRouteCompletion(userId, routeId);
        if (isCompleted) {
          logger.info(`🎉 用户 ${userId} 已完成路线 ${routeId}，触发 NFT 奖励！`);
          await triggerNFTReward(userId, routeId);
          processed.add(task); // 标记为已处理
        }
      } catch (error) {
        logger.error(`❌ 处理用户 ${userId} 路线 ${routeId} 时出错:`, error);
      }
    }
  } catch (error) {
    logger.error('❌ 检查打卡记录失败:', error);
  }
}

// 路线完成检测
async function checkRouteCompletion(userId: string, routeId: string) {
  const completedPOIs = await prisma.checkin.count({
    where: {
      userId,
      routeId,
      status: 'approved',
    },
  });

  const totalPOIs = await prisma.pOI.count({
    where: { routeId },
  });

  return completedPOIs === totalPOIs;
}

// NFT 自动铸造触发
async function triggerNFTReward(userId: string, routeId: string) {
  const voucher = await prisma.voucher.create({
    data: {
      userId,
      routeId,
      status: 'pending',
    },
  });

  logger.info(`🎫 已创建凭证: ${voucher.id}，加入铸造队列...`);
  await mintQueue.add('mint-nft', { voucherId: voucher.id });
}

// 启动轮询
export function startCheckinWatcher() {
  logger.info(`✅ 打卡监控已启动，每 ${POLLING_INTERVAL / 1000} 秒检查一次`);

  // 立即执行一次
  checkNewCheckins().catch(console.error);

  // 定时轮询
  setInterval(checkNewCheckins, POLLING_INTERVAL);
}