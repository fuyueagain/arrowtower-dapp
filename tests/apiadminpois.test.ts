// /tests/apiadminpois.test.ts (修复版)

/**
 * 主要修复点：
 * 1. 在全局禁用 console.error 的真实输出（测试过程中会触发路由的 catch 分支并打印错误，测试中这是正常的断言路径），避免测试日志被污染。
 * 2. 保持对 next/server、next-auth 与 @prisma/client 的 mock，但在每个用例前后清理 mock。
 * 3. 保持对 route handler 的导入在 mock 之后，确保被测代码使用的是 mock 的 prisma 与 session。
 *
 * 说明：如果你更希望在失败路径上断言 console.error 被调用（而不是静默），可以把全局的 mock 改为在特定的 describe/it 中 spy 并断言调用。
 */

// 0) 全局抑制 console.error（避免测试输出被大量错误日志污染）
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
      // 返回一个对象，测试中我们直接 await res.json() 即可拿到 data
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

// 3) Mock PrismaClient（覆盖 pOI / route / checkin / checkinPhoto 所需方法）
jest.mock('@prisma/client', () => {
  const pOI = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const route = {
    findUnique: jest.fn(),
  };
  const checkin = {
    deleteMany: jest.fn(),
  };
  const checkinPhoto = {
    deleteMany: jest.fn(),
  };

  const mockPrisma = { pOI, route, checkin, checkinPhoto } as any;
  class PrismaClient {
    constructor() {
      return mockPrisma;
    }
  }
  return { PrismaClient };
});

// 4) 在 mock 之后导入被测路由
import { GET as GET_POIS, POST as POST_POIS } from '@/app/api/admin/pois/route';
import { GET as GET_POI_DETAIL, PUT as PUT_POI_DETAIL, DELETE as DELETE_POI_DETAIL } from '@/app/api/admin/pois/[id]/route';
import { getServerSession } from 'next-auth';

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================================================
// 测试套件
// ==================================================

describe('管理员POI接口 - 权限与列表', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin' } });
  });

  test('未授权返回 401', async () => {
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/admin/pois');
    const res = await GET_POIS(req as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toBe('未授权访问');
  });

  test('成功返回 POI 列表并按 routeId/order 排序', async () => {
    const mockList = [ { id: 'p1', routeId: 'r1', order: 1 }, { id: 'p2', routeId: 'r1', order: 2 } ];
    prisma.pOI.findMany.mockResolvedValue(mockList);

    const req = new Request('http://localhost/api/admin/pois');
    const res = await GET_POIS(req as any);
    const json = await res.json();

    expect(prisma.pOI.findMany).toHaveBeenCalledWith({ orderBy: [{ routeId: 'asc' }, { order: 'asc' }] });
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockList);
  });

  test('获取列表异常返回 500', async () => {
    prisma.pOI.findMany.mockRejectedValue(new Error('DB'));

    const req = new Request('http://localhost/api/admin/pois');
    const res = await GET_POIS(req as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});

describe('POST /api/admin/pois - 创建与校验', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('成功创建 POI 返回 201', async () => {
    prisma.route.findUnique.mockResolvedValue({ id: 'route_001' });
    const body = {
      routeId: 'route_001',
      name: '箭塔广场',
      description: '拍照打卡点',
      latitude: 23.5,
      longitude: 113.3,
      radius: 50,
      taskType: 'photo',
      order: 1,
    };
    const created = { id: 'poi_001', ...body };
    prisma.pOI.create.mockResolvedValue(created);

    const req = new Request('http://localhost/api/admin/pois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await POST_POIS(req as any);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.poi).toEqual(created);
  });

  test('routeId 缺失返回 400', async () => {
    const req = new Request('http://localhost/api/admin/pois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', latitude: 1, longitude: 2, order: 1 }),
    });
    const res = await POST_POIS(req as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('所属路线(routeId)必填');
  });

  test('所属路线不存在返回 400', async () => {
    prisma.route.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/admin/pois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId: 'r-not', name: 'A', latitude: 1, longitude: 2, order: 1 }),
    });
    const res = await POST_POIS(req as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('所属路线不存在');
  });

  test('经纬度必须为数字返回 400', async () => {
    prisma.route.findUnique.mockResolvedValue({ id: 'route_001' });
    const req = new Request('http://localhost/api/admin/pois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId: 'route_001', name: 'A', latitude: 'x', longitude: 'y', order: 1 }),
    });
    const res = await POST_POIS(req as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('经纬度必须为数字');
  });

  test('顺序必须为正整数返回 400', async () => {
    prisma.route.findUnique.mockResolvedValue({ id: 'route_001' });
    const req = new Request('http://localhost/api/admin/pois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId: 'route_001', name: 'A', latitude: 1, longitude: 2, order: 0 }),
    });
    const res = await POST_POIS(req as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('顺序(order)必须为正整数');
  });

  test('创建抛错返回 400', async () => {
    prisma.route.findUnique.mockResolvedValue({ id: 'route_001' });
    prisma.pOI.create.mockRejectedValue(new Error('invalid'));
    const req = new Request('http://localhost/api/admin/pois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId: 'route_001', name: 'A', latitude: 1, longitude: 2, order: 1 }),
    });
    const res = await POST_POIS(req as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

describe('POI 详情 GET/PUT', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('GET 存在返回 200，不存在返回 404', async () => {
    prisma.pOI.findUnique.mockResolvedValueOnce({ id: 'poi_001', name: 'A' });
    const req = new Request('http://localhost/api/admin/pois/poi_001');
    // route handlers 的第二个参数通常为 { params: { id } }
    const res1 = await GET_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    expect(res1.status).toBe(200);

    prisma.pOI.findUnique.mockResolvedValueOnce(null);
    const res2 = await GET_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json2 = await res2.json();
    expect(res2.status).toBe(404);
    expect(json2.message).toBe('打卡点不存在');
  });

  test('PUT 成功更新返回 200', async () => {
    prisma.pOI.update.mockResolvedValue({ id: 'poi_001', name: 'B', order: 2 });
    const req = new Request('http://localhost/api/admin/pois/poi_001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'B', order: 2 }),
    });
    const res = await PUT_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.poi.name).toBe('B');
  });

  test('PUT 路线不存在返回 400', async () => {
    prisma.route.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/admin/pois/poi_001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId: 'no-route' }),
    });
    const res = await PUT_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('所属路线不存在');
  });

  test('PUT 经纬度校验失败返回 400', async () => {
    const req = new Request('http://localhost/api/admin/pois/poi_001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 'bad' }),
    });
    const res = await PUT_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('纬度必须为数字');
  });

  test('PUT 顺序非正整数返回 400', async () => {
    const req = new Request('http://localhost/api/admin/pois/poi_001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: 0 }),
    });
    const res = await PUT_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('顺序必须为正整数');
  });
});

describe('DELETE /api/admin/pois/[id] 删除逻辑', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('不存在返回 404', async () => {
    prisma.pOI.findUnique.mockResolvedValue(null);
    const req = new Request('http://localhost/api/admin/pois/poi_001', { method: 'DELETE' });
    const res = await DELETE_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.message).toBe('打卡点不存在');
  });

  test('成功删除并清理关联返回 200', async () => {
    prisma.pOI.findUnique.mockResolvedValue({ id: 'poi_001' });
    prisma.checkinPhoto.deleteMany.mockResolvedValue({});
    prisma.checkin.deleteMany.mockResolvedValue({});
    prisma.pOI.delete.mockResolvedValue({ id: 'poi_001' });

    const req = new Request('http://localhost/api/admin/pois/poi_001', { method: 'DELETE' });
    const res = await DELETE_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.checkinPhoto.deleteMany).toHaveBeenCalledWith({ where: { poiId: 'poi_001' } });
    expect(prisma.checkin.deleteMany).toHaveBeenCalledWith({ where: { poiId: 'poi_001' } });
    expect(prisma.pOI.delete).toHaveBeenCalledWith({ where: { id: 'poi_001' } });
    expect(json.data.id).toBe('poi_001');
  });

  test('删除过程中异常返回 500', async () => {
    prisma.pOI.findUnique.mockResolvedValue({ id: 'poi_001' });
    prisma.checkinPhoto.deleteMany.mockResolvedValue({});
    prisma.checkin.deleteMany.mockResolvedValue({});
    prisma.pOI.delete.mockRejectedValue(new Error('fail'));

    const req = new Request('http://localhost/api/admin/pois/poi_001', { method: 'DELETE' });
    const res = await DELETE_POI_DETAIL(req as any, { params: { id: 'poi_001' } } as any);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
