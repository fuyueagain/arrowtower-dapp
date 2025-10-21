// src/app/api/admin/checkins/[id]/route.ts
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

// PUT /api/admin/checkins/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ['pending', 'approved', 'rejected', 'flagged'];
    const status = String(body.status);
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, message: '状态值无效' },
        { status: 400 }
      );
    }

    const checkin = await prisma.checkin.update({ where: { id }, data: { status } });

    return NextResponse.json(
      { success: true, data: { checkin }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('更新打卡记录失败:', error);
    return NextResponse.json(
      { success: false, message: '无效的请求数据', error: error.message },
      { status: 400 }
    );
  }
}

// DELETE /api/admin/checkins/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const exists = await prisma.checkin.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json(
        { success: false, message: '打卡记录不存在' },
        { status: 404 }
      );
    }

    await prisma.checkinPhoto.deleteMany({ where: { checkinId: id } });
    await prisma.checkin.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { id }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('删除打卡记录失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}