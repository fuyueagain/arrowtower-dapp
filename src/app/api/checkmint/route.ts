import { NextRequest, NextResponse } from 'next/server';
import { checkLatestMintByWalletAddress } from '@/lib/db/voucher';

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json(
      { error: '缺少钱包地址参数' },
      { status: 400 }
    );
  }

  const maxRetries = 5;
  const retryDelay = 1000; // 1秒
  let lastResult;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`第 ${attempt} 次查询钱包地址: ${walletAddress}`);
      
      const result = await checkLatestMintByWalletAddress(walletAddress);
      lastResult = result;

      // 如果查询成功且找到NFT，直接返回
      if (result.success) {
        return NextResponse.json({
          success: true,
          nftTokenId: result.nftTokenId,
          metadata: result.metadata,
          message: result.message,
          attempts: attempt
        });
      }

      // 如果是最后一次尝试，直接返回结果
      if (attempt === maxRetries) {
        break;
      }

      // 如果不是最后一次尝试，等待后重试
      console.log(`第 ${attempt} 次查询未找到NFT，${retryDelay}ms后重试...`);
      await delay(retryDelay);

    } catch (error) {
      console.error(`第 ${attempt} 次查询时出错:`, error);
      lastResult = {
        success: false,
        message: `查询过程中出错: ${error instanceof Error ? error.message : '未知错误'}`
      };

      // 如果是最后一次尝试，直接返回错误
      if (attempt === maxRetries) {
        break;
      }

      // 等待后重试
      await delay(retryDelay);
    }
  }

  // 所有重试都失败或未找到NFT
  return NextResponse.json({
    success: false,
    message: lastResult?.message || '经过多次尝试后仍未找到NFT铸造记录',
    attempts: maxRetries
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: '缺少钱包地址参数' },
        { status: 400 }
      );
    }

    const maxRetries = 5;
    const retryDelay = 1000;
    let lastResult;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`第 ${attempt} 次查询钱包地址: ${walletAddress}`);
        
        const result = await checkLatestMintByWalletAddress(walletAddress);
        lastResult = result;

        if (result.success) {
          return NextResponse.json({
            success: true,
            nftTokenId: result.nftTokenId,
            metadata: result.metadata,
            message: result.message,
            attempts: attempt
          });
        }

        if (attempt === maxRetries) {
          break;
        }

        console.log(`第 ${attempt} 次查询未找到NFT，${retryDelay}ms后重试...`);
        await delay(retryDelay);

      } catch (error) {
        console.error(`第 ${attempt} 次查询时出错:`, error);
        lastResult = {
          success: false,
          message: `查询过程中出错: ${error instanceof Error ? error.message : '未知错误'}`
        };

        if (attempt === maxRetries) {
          break;
        }

        await delay(retryDelay);
      }
    }

    return NextResponse.json({
      success: false,
      message: lastResult?.message || '经过多次尝试后仍未找到NFT铸造记录',
      attempts: maxRetries
    });

  } catch (error) {
    console.error('处理POST请求时出错:', error);
    return NextResponse.json(
      { error: '无效的请求数据' },
      { status: 400 }
    );
  }
}