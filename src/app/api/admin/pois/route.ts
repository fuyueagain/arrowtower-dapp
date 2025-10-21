// src/app/api/admin/pois/route.ts
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

// GET /api/admin/pois
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const pois = await prisma.pOI.findMany({
      orderBy: [{ routeId: 'asc' }, { order: 'asc' }],
    });
    return NextResponse.json(
      { success: true, data: pois, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('获取打卡点失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/pois
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const body = await request.json();
    const { routeId, name, description, latitude, longitude, radius = 50, taskType = 'photo', order } = body || {};

    if (!routeId || typeof routeId !== 'string') {
      return NextResponse.json(
        { success: false, message: '所属路线(routeId)必填' },
        { status: 400 }
      );
    }
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      return NextResponse.json(
        { success: false, message: '所属路线不存在' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: '打卡点名称必填' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return NextResponse.json(
        { success: false, message: '经纬度必须为数字' },
        { status: 400 }
      );
    }
    if (!Number.isInteger(Number(order)) || Number(order) <= 0) {
      return NextResponse.json(
        { success: false, message: '顺序(order)必须为正整数' },
        { status: 400 }
      );
    }

    const poi = await prisma.pOI.create({
      data: {
        routeId,
        name,
        description: description ?? null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius),
        taskType,
        order: Number(order),
      },
    });

    return NextResponse.json(
      { success: true, data: { poi }, timestamp: new Date().toISOString() },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('创建打卡点失败:', error);
    return NextResponse.json(
      { success: false, message: '无效的请求数据', error: error.message },
      { status: 400 }
    );
  }
}