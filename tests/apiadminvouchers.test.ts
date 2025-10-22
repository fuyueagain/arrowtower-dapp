// /tests/apiadminvouchers.test.ts

// 1) Mock next/server 的 NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, opts?: any) => ({
      json: async () => data,
      status: opts?.status ?? 200,
      ok: opts?.status ? opts.status >= 200 && opts.status < 300 : true,
    })),
  },
}));

// 2) Mock next-auth 的 getServerSession（默认返回管理员）
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { role: 'admin' } })),
}));

// 3) Mock PrismaClient（覆盖 voucher 所需方法）
jest.mock('@prisma/client', () => {
  const voucher = {
    findMany: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  };
  const mockPrisma = { voucher } as any;
  class PrismaClient {
    constructor() {
      return mockPrisma;
    }
  }
  return { PrismaClient };
});

// 4) 在 mock 之后导入被测路由
import { GET as GET_VOUCHERS } from '@/app/api/admin/vouchers/route';
import { PUT as PUT_VOUCHER_DETAIL, DELETE as DELETE_VOUCHER_DETAIL } from '@/app/api/admin/vouchers/[id]/route';
import { getServerSession } from 'next-auth';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('管理员凭证接口 - 权限与列表', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin' } });
  });

  test('未授权返回 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/admin/vouchers');
    const res = await GET_VOUCHERS(req as any);
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.message).toBe('未授权访问');
  });

  test('成功返回凭证列表（包含用户与路线信息）', async () => {
    const now = new Date();
    prisma.voucher.findMany.mockResolvedValue([
      {
        id: 'v1', userId: 'u1', routeId: 'r1', status: 'minted', createdAt: now,
        user: { nickname: 'Alice' },
        route: { name: '文化探索路线' },
      },
    ]);

    const req = new Request('http://localhost/api/admin/vouchers');
    const res = await GET_VOUCHERS(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.vouchers)).toBe(true);
    expect(json.data.vouchers[0].user.nickname).toBe('Alice');
    expect(json.data.vouchers[0].route.name).toBe('文化探索路线');
  });

  test('获取凭证异常返回 500', async () => {
    prisma.voucher.findMany.mockRejectedValue(new Error('DB'));
    const req = new Request('http://localhost/api/admin/vouchers');
    const res = await GET_VOUCHERS(req as any);
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});

describe('PUT /api/admin/vouchers/[id] 更新', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('状态 completed 映射为 minted 并成功更新', async () => {
    prisma.voucher.update.mockResolvedValue({ id: 'v1', status: 'minted' });
    const req = new Request('http://localhost/api/admin/vouchers/v1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const params = Promise.resolve({ id: 'v1' });
    const res = await PUT_VOUCHER_DETAIL(req as any, { params } as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.voucher.status).toBe('minted');
    expect(prisma.voucher.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { status: 'minted' } });
  });

  test('设置 tokenId 与 txHash 为 null', async () => {
    prisma.voucher.update.mockResolvedValue({ id: 'v1', status: 'pending', nftTokenId: null, mintTxHash: null });
    const req = new Request('http://localhost/api/admin/vouchers/v1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nftTokenId: null, mintTxHash: null }),
    });
    const params = Promise.resolve({ id: 'v1' });
    const res = await PUT_VOUCHER_DETAIL(req as any, { params } as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(prisma.voucher.update).toHaveBeenCalledWith({ where: { id: 'v1' }, data: { nftTokenId: null, mintTxHash: null } });
  });

  test('非法状态返回 400', async () => {
    const req = new Request('http://localhost/api/admin/vouchers/v1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'weird' }),
    });
    const params = Promise.resolve({ id: 'v1' });
    const res = await PUT_VOUCHER_DETAIL(req as any, { params } as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('状态值无效');
  });
});

describe('DELETE /api/admin/vouchers/[id] 删除逻辑', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('不存在返回 404', async () => {
    prisma.voucher.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/admin/vouchers/v1', { method: 'DELETE' });
    const params = Promise.resolve({ id: 'v1' });
    const res = await DELETE_VOUCHER_DETAIL(req as any, { params } as any);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.message).toBe('凭证不存在');
  });

  test('成功删除返回 200', async () => {
    prisma.voucher.findUnique.mockResolvedValue({ id: 'v1' });
    prisma.voucher.delete.mockResolvedValue({ id: 'v1' });
    const req = new Request('http://localhost/api/admin/vouchers/v1', { method: 'DELETE' });
    const params = Promise.resolve({ id: 'v1' });
    const res = await DELETE_VOUCHER_DETAIL(req as any, { params } as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(prisma.voucher.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
  });

  test('删除异常返回 500', async () => {
    prisma.voucher.findUnique.mockResolvedValue({ id: 'v1' });
    prisma.voucher.delete.mockRejectedValue(new Error('fail'));
    const req = new Request('http://localhost/api/admin/vouchers/v1', { method: 'DELETE' });
    const params = Promise.resolve({ id: 'v1' });
    const res = await DELETE_VOUCHER_DETAIL(req as any, { params } as any);
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});