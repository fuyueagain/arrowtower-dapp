// src/app/api/upload/photo/route.ts

//API 接口实现：POST /api/upload/photo

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 确保上传目录存在
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error('创建上传目录失败:', err);
  }
}

// POST /api/upload/photo
export async function POST(request: NextRequest) {
  try {
    // 1. 确保上传目录存在
    await ensureUploadDir();

    // 2. 解析 multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const checkinId = formData.get('checkinId') as string;
    const poiId = formData.get('poiId') as string;

    // 3. 参数校验
    if (!file) {
      return NextResponse.json(
        { success: false, message: '缺少文件' },
        { status: 400 }
      );
    }

    if (!checkinId || !poiId) {
      return NextResponse.json(
        { success: false, message: '缺少 checkinId 或 poiId' },
        { status: 400 }
      );
    }

    // 4. 验证 Checkin 是否存在
    const checkin = await prisma.checkin.findUnique({
      where: { id: checkinId },
    });

    if (!checkin) {
      return NextResponse.json(
        { success: false, message: '打卡记录不存在' },
        { status: 404 }
      );
    }

    // 5. 验证 POI 是否存在且匹配
    const poi = await prisma.pOI.findUnique({
      where: { id: poiId },
    });

    if (!poi || poi.id !== poiId) {
      return NextResponse.json(
        { success: false, message: '打卡点不存在' },
        { status: 404 }
      );
    }

    // 6. 读取文件 buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. 生成唯一文件名
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `checkin_${checkinId}_photo_${randomBytes(4).toString('hex')}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // 8. 写入文件
    await writeFile(filepath, buffer);

    // 9. 构建可访问的 URL（前端用）
    const url = `/uploads/${filename}`;

    // 10. 保存到数据库
    const photo = await prisma.checkinPhoto.create({
      data: {
        checkinId,
        poiId,
        url,
        filename,
        size: buffer.length,
        mimeType: file.type || 'image/jpeg',
      },
    });

    // 11. 返回成功响应
    return NextResponse.json(
      {
        success: true,
        data: {
          url,
          filename,
          size: buffer.length,
          mimeType: file.type || 'image/jpeg',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('上传照片失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}



// {
//   "success": true,
//   "data": {
//     "url": "/uploads/checkin_chk_abc_photo_1a2b3c4d.jpg",
//     "filename": "checkin_chk_abc_photo_1a2b3c4d.jpg",
//     "size": 2048576,
//     "mimeType": "image/jpeg"
//   },
//   "timestamp": "2025-10-01T12:29:50Z"
// }


// public/
//  └── uploads/
//       ├── checkin_chk_abc_photo_1a2b3c4d.jpg
//       ├── checkin_chk_def_photo_5e6f7a8b.png
//       └── ...

// 前端可通过 /uploads/xxx.jpg 直接访问
// 文件名带 checkinId + 随机哈希，避免冲突


// 查询某次打卡的所有照片
// const checkinWithPhotos = await prisma.checkin.findUnique({
//   where: { id: 'chk_abc123' },
//   include: {
//     photos: true
//   }
// });

// 查询某个 POI 的所有上传照片（来自不同用户）
// const poiWithPhotos = await prisma.pOI.findUnique({
//   where: { id: 'poi_002' },
//   include: {
//     photos: {
//       include: { checkin: { include: { user: true } } }
//     }
//   }
// });