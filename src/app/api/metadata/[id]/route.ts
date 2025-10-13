// app/api/metadata/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMetadataByTokenId} from '@/lib/db/metadata';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 首先 await params
    const { id } = await params;

    // 检查 id 是否为有效的 tokenId 格式（字符串）
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: '无效的Token ID格式' }, { status: 400 });
    }

    // 使用 getMetadataByTokenId 获取元数据
    const metadata = await getMetadataByTokenId(id);

    if (!metadata) {
      return NextResponse.json({ error: '未找到对应的元数据' }, { status: 404 });
    }

    // 从 metadata 字段中提取 NFT 元数据信息
    const nftMetadata = metadata.metadata;
    
    if (!nftMetadata) {
      return NextResponse.json({ error: '元数据格式不正确' }, { status: 500 });
    }

    // 构建标准的 NFT 元数据响应
    const responseData = {
      name: nftMetadata.name || `Completion Badge`,
      description: nftMetadata.description || 'NFT completion badge',
      image: nftMetadata.image,
      external_url: nftMetadata.external_url,
      background_color: nftMetadata.background_color || "000000",
      attributes: metadata.attributes || [], // 使用解析后的 attributes
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('获取元数据API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}