// app/api/metadata/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMetadataById } from '@/lib/db/metadata';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 首先 await params
    const { id: idString } = await params;
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: '无效的ID格式' }, { status: 400 });
    }

    const metadata = await getMetadataById(id);

    if (!metadata) {
      return NextResponse.json({ error: '未找到对应的元数据' }, { status: 404 });
    }

    // 构建标准的 NFT 元数据响应
    const nftMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      external_url: metadata.external_url,
      attributes: metadata.attributes,
      background_color: metadata.background_color,
    };

    return NextResponse.json(nftMetadata, {
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