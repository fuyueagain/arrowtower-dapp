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


async function generateVoucherMetadata(voucherId: string) {
  console.log('---------metedata');
  try {
    // 执行等价于你 SQL 的查询
    const result = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: {
        user: true,
        route: true,
        // 注意：Voucher 和 Checkin 没有直接关系，需通过 routeId + userId 关联
      },
    });   

    if (!result) {
      throw new Error('Voucher not found');
    }

    const { user, route } = result;

    // 查询该用户在该路线上的所有打卡记录（Checkin），并获取对应的 POI 信息
    const checkins = await prisma.checkin.findMany({
      where: {
        userId: user.id,
        routeId: route.id,
      },
      include: {
        poi: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    if (checkins.length === 0) {
      throw new Error('No checkins found for this voucher');
    }

    // 假设我们只取第一个打卡点的信息作为代表（或可聚合所有 POI）
    const firstPoi = checkins[0].poi;

    const img_ramdom = Math.floor(Math.random() * 25) + 1;

    // 构造 metadata JSON（符合你的 Metadata 模型）
    const metadata = {
      name: `Completion Badge: ${route.name}`,
      description: `NFT awarded to ${user.nickname} (${user.walletAddress}) for completing the route "${route.name}". Verified via on-chain check-ins at multiple points of interest.`,
      image: `https://arrowtower.netlify.app/pic/img_${img_ramdom}.svg`,
      external_url: `https://arrowtower.netlify.app/user/${user.id}/route/${route.id}`,
      background_color: "000000",

      // attributes 是字符串类型，但通常存储 JSON 字符串
      attributes: JSON.stringify([
        {
          trait_type: "Route",
          value: route.name,
        },
        {
          trait_type: "User",
          value: user.nickname,
        },
        {
          trait_type: "Wallet Address",
          value: user.walletAddress,
        },
        {
          trait_type: "Completion Status",
          value: result.status,
        },
        {
          trait_type: "POIs Visited",
          value: checkins.length,
        },
        {
          trait_type: "Estimated Time",
          value: `${route.estimatedTime} minutes`,
        },
        {
          trait_type: "Difficulty",
          value: route.difficulty,
        },
      ]),

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log(metadata);
    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    throw error;
  }
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

    // 生成 metaData信息
    const metadata = await generateVoucherMetadata(voucherId);

    // ✅ 更新凭证状态
    await prisma.voucher.update({
      where: { id: voucherId },
      data: {
        status: 'minted',
        nftTokenId: result?.tokenId || null,
        mintTxHash: result?.txHash || null,
        metadata: metadata || null,
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