// /tests/apiadmincheckins.test.ts (修复版)

/**
 * 修复要点：
 * 1. 全局抑制 console.error（测试的错误分支通常会触发路由的 catch 并打印错误，抑制能让测试输出更干净）。
 * 2. 在 mock 之后再导入被测路由，确保被测代码使用的是 mock 的 prisma 与 session。
 * 3. 统一把 route handler 的第二个参数 params 传为 { params: { id } }，更贴合 Next.js 实际调用方式。
 * 4. 每个测试前使用 jest.clearAllMocks()，避免 mock 相互影响。
 */

// 全局抑制 console.error
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as unknown as jest.Mock).mockRestore();
});

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

// 3) Mock PrismaClient（覆盖 checkin 与 checkinPhoto）
jest.mock('@prisma/client', () => {
  const checkin = {
    findMany: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };
  const checkinPhoto = {
    deleteMany: jest.fn(),
  };

  const mockPrisma = { checkin, checkinPhoto } as any;
  class PrismaClient {
    constructor() {
      return mockPrisma;
    }
  }
  return { PrismaClient };
});

// 4) 在 mock 之后导入被测路由
import { GET as GET_CHECKINS } from '@/app/api/admin/checkins/route';
import { PUT as PUT_CHECKIN_DETAIL, DELETE as DELETE_CHECKIN_DETAIL } from '@/app/api/admin/checkins/[id]/route';
import { getServerSession } from 'next-auth';

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================================================
// 测试套件
// ==================================================

describe('管理员打卡记录接口 - 权限与列表', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin' } });
  });

  test('未授权返回 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/admin/checkins');
    const res = await GET_CHECKINS(req as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toBe('未授权访问');
  });

  test('成功返回格式化后的打卡记录列表', async () => {
    const now = new Date();
    prisma.checkin.findMany.mockResolvedValue([
      {
        id: 'c1', userId: 'u1', routeId: 'r1', poiId: 'p1', status: 'pending', createdAt: now,
        user: { nickname: 'Alice' },
        poi: { name: '塔楼' },
      },
    ]);

    const req = new Request('http://localhost/api/admin/checkins');
    const res = await GET_CHECKINS(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data.checkins)).toBe(true);
    expect(json.data.checkins[0].user.nickname).toBe('Alice');
    expect(json.data.checkins[0].poi.name).toBe('塔楼');
  });

  test('获取列表异常返回 500', async () => {
    prisma.checkin.findMany.mockRejectedValue(new Error('DB'));
    const req = new Request('http://localhost/api/admin/checkins');
    const res = await GET_CHECKINS(req as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});

describe('PUT /api/admin/checkins/[id] 状态更新', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('合法状态更新返回 200', async () => {
    prisma.checkin.update.mockResolvedValue({ id: 'c1', status: 'approved' });
    const req = new Request('http://localhost/api/admin/checkins/c1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    const res = await PUT_CHECKIN_DETAIL(req as any, { params: { id: 'c1' } } as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.checkin.status).toBe('approved');
    expect(prisma.checkin.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { status: 'approved' } });
  });

  test('非法状态返回 400', async () => {
    const req = new Request('http://localhost/api/admin/checkins/c1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'unknown' }),
    });
    const res = await PUT_CHECKIN_DETAIL(req as any, { params: { id: 'c1' } } as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('状态值无效');
  });
});

describe('DELETE /api/admin/checkins/[id] 删除逻辑', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('不存在返回 404', async () => {
    prisma.checkin.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/admin/checkins/c1', { method: 'DELETE' });
    const res = await DELETE_CHECKIN_DETAIL(req as any, { params: { id: 'c1' } } as any);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.message).toBe('打卡记录不存在');
  });

  test('成功删除并清理照片返回 200', async () => {
    prisma.checkin.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.checkinPhoto.deleteMany.mockResolvedValue({});
    prisma.checkin.delete.mockResolvedValue({ id: 'c1' });

    const req = new Request('http://localhost/api/admin/checkins/c1', { method: 'DELETE' });
    const res = await DELETE_CHECKIN_DETAIL(req as any, { params: { id: 'c1' } } as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.checkinPhoto.deleteMany).toHaveBeenCalledWith({ where: { checkinId: 'c1' } });
    expect(prisma.checkin.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  test('删除异常返回 500', async () => {
    prisma.checkin.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.checkinPhoto.deleteMany.mockResolvedValue({});
    prisma.checkin.delete.mockRejectedValue(new Error('fail'));

    const req = new Request('http://localhost/api/admin/checkins/c1', { method: 'DELETE' });
    const res = await DELETE_CHECKIN_DETAIL(req as any, { params: { id: 'c1' } } as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
