// src/app/api/admin/vouchers/route.ts
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

// GET /api/admin/vouchers
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const vouchers = await prisma.voucher.findMany({
      include: {
        user: { select: { nickname: true } },
        route: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(
      { success: true, data: { vouchers }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('获取凭证失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}
