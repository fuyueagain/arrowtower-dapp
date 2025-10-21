// src/app/api/admin/routes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    );
  }
  return null;
}

// GET /api/admin/routes
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const routes = await prisma.route.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(
      { success: true, data: { routes }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('获取路线失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/routes
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const body = await request.json();
    const {
      name,
      description,
      difficulty = 'medium',
      estimatedTime,
      poiCount,
      isActive = true,
      coverImage,
      nftCollection,
    } = body || {};

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: '路线名称必填' },
        { status: 400 }
      );
    }
    const allowedDifficulty = ['easy', 'medium', 'hard'];
    if (!allowedDifficulty.includes(difficulty)) {
      return NextResponse.json(
        { success: false, message: '难度必须为 easy/medium/hard' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(Number(estimatedTime)) || Number(estimatedTime) <= 0) {
      return NextResponse.json(
        { success: false, message: '预计时长必须为正数' },
        { status: 400 }
      );
    }
    if (!Number.isInteger(Number(poiCount)) || Number(poiCount) <= 0) {
      return NextResponse.json(
        { success: false, message: '打卡点数量必须为正整数' },
        { status: 400 }
      );
    }

    const route = await prisma.route.create({
      data: {
        name,
        description: description ?? null,
        difficulty,
        estimatedTime: Number(estimatedTime),
        poiCount: Number(poiCount),
        isActive: Boolean(isActive),
        coverImage: coverImage ?? null,
        nftCollection: nftCollection ?? null,
      },
    });

    return NextResponse.json(
      { success: true, data: { route }, timestamp: new Date().toISOString() },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('创建路线失败:', error);
    return NextResponse.json(
      { success: false, message: '无效的请求数据', error: error.message },
      { status: 400 }
    );
  }
}