// src/app/api/admin/vouchers/[id]/route.ts
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

// PUT /api/admin/vouchers/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const body = await request.json();
    const data: any = {};

    if (body.status !== undefined) {
      const status = String(body.status);
      const allowed = ['pending', 'minting', 'completed', 'failed', 'minted'];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, message: '状态值无效' },
          { status: 400 }
        );
      }
      // 兼容前端“completed”映射为数据库“minted”
      data.status = status === 'completed' ? 'minted' : status;
    }

    if (body.nftTokenId !== undefined) {
      data.nftTokenId = body.nftTokenId ? String(body.nftTokenId) : null;
    }

    if (body.mintTxHash !== undefined) {
      data.mintTxHash = body.mintTxHash ? String(body.mintTxHash) : null;
    }

    if (body.metadata !== undefined) {
      data.metadata = body.metadata ?? null;
    }

    const voucher = await prisma.voucher.update({ where: { id }, data });

    return NextResponse.json(
      { success: true, data: { voucher }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('更新凭证失败:', error);
    return NextResponse.json(
      { success: false, message: '无效的请求数据', error: error.message },
      { status: 400 }
    );
  }
}

// DELETE /api/admin/vouchers/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const exists = await prisma.voucher.findUnique({ where: { id } });
    if (!exists) {
      return NextResponse.json(
        { success: false, message: '凭证不存在' },
        { status: 404 }
      );
    }

    await prisma.voucher.delete({ where: { id } });
    return NextResponse.json(
      { success: true, data: { id }, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('删除凭证失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}