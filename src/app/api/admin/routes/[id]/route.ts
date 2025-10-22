// src/app/api/admin/routes/[id]/route.ts
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) {
      return NextResponse.json(
        { success: false, message: '路线不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, data: { route }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('获取路线详情失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const body = await request.json();
    const allowedDifficulty = ['easy', 'medium', 'hard'];

    const data: any = {};
    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          { success: false, message: '路线名称无效' },
          { status: 400 }
        );
      }
      data.name = body.name;
    }
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.difficulty !== undefined) {
      if (!allowedDifficulty.includes(body.difficulty)) {
        return NextResponse.json(
          { success: false, message: '难度必须为 easy/medium/hard' },
          { status: 400 }
        );
      }
      data.difficulty = body.difficulty;
    }
    if (body.estimatedTime !== undefined) {
      if (!Number.isFinite(Number(body.estimatedTime)) || Number(body.estimatedTime) <= 0) {
        return NextResponse.json(
          { success: false, message: '预计时长必须为正数' },
          { status: 400 }
        );
      }
      data.estimatedTime = Number(body.estimatedTime);
    }
    if (body.poiCount !== undefined) {
      if (!Number.isInteger(Number(body.poiCount)) || Number(body.poiCount) <= 0) {
        return NextResponse.json(
          { success: false, message: '打卡点数量必须为正整数' },
          { status: 400 }
        );
      }
      data.poiCount = Number(body.poiCount);
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.coverImage !== undefined) data.coverImage = body.coverImage ?? null;
    if (body.nftCollection !== undefined) data.nftCollection = body.nftCollection ?? null;

    const route = await prisma.route.update({ where: { id }, data });
    return NextResponse.json(
      { success: true, data: { route }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('更新路线失败:', error);
    return NextResponse.json(
      { success: false, message: '无效的请求数据', error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const exists = await prisma.route.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json(
        { success: false, message: '路线不存在' },
        { status: 404 }
      );
    }

    const [poiCount, checkinCount, voucherCount] = await Promise.all([
      prisma.pOI.count({ where: { routeId: id } }),
      prisma.checkin.count({ where: { routeId: id } }),
      prisma.voucher.count({ where: { routeId: id } }),
    ]);

    if (poiCount > 0 || checkinCount > 0 || voucherCount > 0) {
      return NextResponse.json(
        { success: false, message: '路线存在关联数据，无法删除' },
        { status: 409 }
      );
    }

    await prisma.route.delete({ where: { id } });
    return NextResponse.json(
      { success: true, data: { id }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('删除路线失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}