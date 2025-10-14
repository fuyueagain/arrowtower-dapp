import { prisma } from './prisma';

export interface MintCheckResult {
  success: boolean;
  nftTokenId?: string;
  metadata?: any;
  message?: string;
}

/**
 * 检查用户是否有成功铸造的最新NFT
 */
export async function checkLatestMintByWalletAddress(walletAddress: string): Promise<MintCheckResult> {
  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { id: true }
    });

    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    // 查询用户最新成功铸造的NFT凭证
    const latestVoucher = await prisma.voucher.findFirst({
      where: {
        userId: user.id,
        status: 'minted', // 假设成功铸造的状态是 'minted'
        nftTokenId: { not: null } // 确保有tokenId
      },
      orderBy: {
        createdAt: 'desc' // 按创建时间降序，获取最新的
      },
      select: {
        nftTokenId: true,
        metadata: true,
        route: {
          select: {
            name: true
          }
        }
      }
    });

    if (latestVoucher && latestVoucher.nftTokenId) {
      return {
        success: true,
        nftTokenId: latestVoucher.nftTokenId,
        metadata: latestVoucher.metadata
      };
    }

    return {
      success: false,
      message: '未找到成功铸造的NFT'
    };

  } catch (error) {
    console.error('检查NFT铸造状态时出错:', error);
    return {
      success: false,
      message: '查询失败'
    };
  }
}