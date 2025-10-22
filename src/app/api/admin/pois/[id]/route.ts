// src/app/api/admin/pois/[id]/route.ts
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
    const poi = await prisma.pOI.findUnique({ where: { id } });
    if (!poi) {
      return NextResponse.json(
        { success: false, message: '打卡点不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, data: { poi }, timestamp: new Date().toISOString() },
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const body = await request.json();
    const data: any = {};

    if (body.routeId !== undefined) {
      if (!body.routeId || typeof body.routeId !== 'string') {
        return NextResponse.json(
          { success: false, message: '所属路线(routeId)无效' },
          { status: 400 }
        );
      }
      const route = await prisma.route.findUnique({ where: { id: body.routeId } });
      if (!route) {
        return NextResponse.json(
          { success: false, message: '所属路线不存在' },
          { status: 400 }
        );
      }
      data.routeId = body.routeId;
    }

    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          { success: false, message: '打卡点名称无效' },
          { status: 400 }
        );
      }
      data.name = body.name;
    }

    if (body.description !== undefined) data.description = body.description ?? null;

    if (body.latitude !== undefined) {
      if (!Number.isFinite(Number(body.latitude))) {
        return NextResponse.json(
          { success: false, message: '纬度必须为数字' },
          { status: 400 }
        );
      }
      data.latitude = Number(body.latitude);
    }

    if (body.longitude !== undefined) {
      if (!Number.isFinite(Number(body.longitude))) {
        return NextResponse.json(
          { success: false, message: '经度必须为数字' },
          { status: 400 }
        );
      }
      data.longitude = Number(body.longitude);
    }

    if (body.radius !== undefined) {
      if (!Number.isInteger(Number(body.radius)) || Number(body.radius) <= 0) {
        return NextResponse.json(
          { success: false, message: '半径必须为正整数' },
          { status: 400 }
        );
      }
      data.radius = Number(body.radius);
    }

    if (body.taskType !== undefined) data.taskType = String(body.taskType);

    if (body.order !== undefined) {
      if (!Number.isInteger(Number(body.order)) || Number(body.order) <= 0) {
        return NextResponse.json(
          { success: false, message: '顺序必须为正整数' },
          { status: 400 }
        );
      }
      data.order = Number(body.order);
    }

    const poi = await prisma.pOI.update({ where: { id }, data });
    return NextResponse.json(
      { success: true, data: { poi }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('更新打卡点失败:', error);
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
    const exists = await prisma.pOI.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json(
        { success: false, message: '打卡点不存在' },
        { status: 404 }
      );
    }

    // 先删除关联照片和打卡记录，再删除 POI
    await prisma.checkinPhoto.deleteMany({ where: { poiId: id } });
    await prisma.checkin.deleteMany({ where: { poiId: id } });
    await prisma.pOI.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { id }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('删除打卡点失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}