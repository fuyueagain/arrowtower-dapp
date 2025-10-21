

// /tests/apiadminuser.test.ts

// -----------------------------
// 1) 单次 mock userService（包含所有在测试中使用的函数）
// -----------------------------
jest.mock('@/lib/db/userService', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

// -----------------------------
// 2) Mock Prisma（只需一次）
// -----------------------------
jest.mock('@/lib/db/prisma', () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    // 指向测试用 sqlite 数据库（如果需要）
    datasourceUrl: 'file:../data/arrowtower_test.db',
  });
  return { prisma };
});

// -----------------------------
// 3) Mock next/server 的 NextResponse（只需一次）
// -----------------------------
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, opts?: any) => ({
      // 返回一个对象，包含 .json() 异步方法以模拟真实行为
      json: async () => data,
      status: opts?.status ?? 200,
      ok: opts?.status ? opts.status >= 200 && opts.status < 300 : true,
    })),
  },
}));

// -----------------------------
// 4) 在所有 mock 之后导入被测路由和 userService（注意：import 要在 mock 之后）
// -----------------------------
import { GET, POST } from '@/app/api/admin/users/route';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/db/userService';

// -----------------------------
// GET /api/admin/users 测试组
// -----------------------------
describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasourceUrl: 'file:../data/arrowtower_test.db',
    });
    await prisma.$disconnect();
  });

  test('should return users with default pagination', async () => {
    const mockUsersResponse = {
      success: true,
      // 注意：与 service 实现对齐 —— data 包含 users 与 total
      data: {
        users: [
          { id: '1', nickname: 'Alice', walletAddress: '0x123' },
          { id: '2', nickname: 'Bob', walletAddress: '0x456' },
        ],
        total: 2,
      },
    };

    (getUsers as jest.Mock).mockResolvedValue(mockUsersResponse);

    const request = new Request('http://localhost:3000/api/admin/users');
    const response = await GET(request);
    const data = await response.json();

    // route 直接把 getUsers 的返回透传，所以断言 getUsers 被正确调用，以及返回原样透传
    expect(getUsers).toHaveBeenCalledWith(1, 10);
    expect(data).toEqual(mockUsersResponse);
  });

  test('should return users with custom pagination', async () => {
    const mockUsersResponse = {
      success: true,
      data: {
        users: [],
        total: 50,
      },
      // 因为我们是 mock getUsers，所以可以在返回值里加上 page/pageSize 字段，route 会透传
      page: 3,
      pageSize: 20,
    };

    (getUsers as jest.Mock).mockResolvedValue(mockUsersResponse);

    const request = new Request('http://localhost:3000/api/admin/users?page=3&pageSize=20');
    const response = await GET(request);
    const data = await response.json();

    expect(getUsers).toHaveBeenCalledWith(3, 20);
    // route 透传 mocked 返回，所以这些字段应存在
    expect(data.page).toBe(3);
    expect(data.pageSize).toBe(20);
    expect(data.data).toBeDefined();
  });

/*   test('should handle invalid pagination parameters', async () => {
    const mockUsersResponse = {
      success: true,
      data: {
        users: [],
        total: 0,
      },
    };

    (getUsers as jest.Mock).mockResolvedValue(mockUsersResponse);

    const request = new Request('http://localhost:3000/api/admin/users?page=invalid&pageSize=abc');
    const response = await GET(request);
    const data = await response.json();

    // 确认 route 在解析无效参数时回退到默认值 1, 10，从而调用 service 时传入默认值
    expect(getUsers).toHaveBeenCalledWith(1, 10);
    expect(data).toEqual(mockUsersResponse);
  }); */
});

// -----------------------------
// POST /api/admin/users 测试组
// -----------------------------
describe('POST /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new user successfully', async () => {
    const mockUserData = {
      id: 'test-user-001',
      walletAddress: '0x123456789abcdef0000000000000000000000000',
      walletType: 'metamask',
      nickname: 'TestUser',
      avatar: 'https://example.com/avatar.png',
      role: 'user',
    };

    const mockCreateResponse = {
      success: true,
      data: mockUserData,
    };

    (createUser as jest.Mock).mockResolvedValue(mockCreateResponse);

    const request = new Request('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUserData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(createUser).toHaveBeenCalledWith(mockUserData);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockUserData);
  });

  test('should handle user creation failure', async () => {
    const mockUserData = {
      walletAddress: '0x123',
      nickname: 'TestUser',
    };

    const mockErrorResponse = {
      success: false,
      error: 'Wallet address already exists',
    };

    (createUser as jest.Mock).mockResolvedValue(mockErrorResponse);

    const request = new Request('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUserData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});

// ================================================================
// 以下为 /api/admin/users/[id] 路由的测试，继续使用同一个合并后的 mock
// ================================================================
import { PUT, DELETE } from '@/app/api/admin/users/[id]/route';

describe('PUT /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasourceUrl: 'file:../data/arrowtower_test.db',
    });
    await prisma.$disconnect();
  });

  test('should update user successfully', async () => {
    const userId = 'test-user-001';
    const updateData = { nickname: 'UpdatedName' };
    
    const mockUpdateResponse = {
      success: true,
      data: {
        id: userId,
        nickname: 'UpdatedName',
        walletAddress: '0x123',
      },
    };

    (updateUser as jest.Mock).mockResolvedValue(mockUpdateResponse);

    const request = new Request(`http://localhost:3000/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    // Next.js route handler 上下文中的 params 有时是同步对象或 Promise，为兼容测试我们传入与原来相同的形式
    const params = Promise.resolve({ id: userId });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(updateUser).toHaveBeenCalledWith(userId, updateData);
    expect(data.success).toBe(true);
    expect(data.data?.nickname).toBe('UpdatedName');
  });

  test('should handle update for non-existent user', async () => {
    const userId = 'non-existent-id';
    const updateData = { nickname: 'NoOne' };

    const mockErrorResponse = {
      success: false,
      error: 'User not found',
    };

    (updateUser as jest.Mock).mockResolvedValue(mockErrorResponse);

    const request = new Request(`http://localhost:3000/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    const params = Promise.resolve({ id: userId });
    const response = await PUT(request, { params });
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});

describe('DELETE /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should delete user successfully', async () => {
    const userId = 'test-user-001';

    const mockDeleteResponse = {
      success: true,
      message: 'User deleted successfully',
    };

    (deleteUser as jest.Mock).mockResolvedValue(mockDeleteResponse);

    const request = new Request(`http://localhost:3000/api/admin/users/${userId}`, {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: userId });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(deleteUser).toHaveBeenCalledWith(userId);
    expect(data.success).toBe(true);
  });

  test('should handle delete for non-existent user', async () => {
    const userId = 'non-existent-id';

    const mockErrorResponse = {
      success: false,
      error: 'User not found',
    };

    (deleteUser as jest.Mock).mockResolvedValue(mockErrorResponse);

    const request = new Request(`http://localhost:3000/api/admin/users/${userId}`, {
      method: 'DELETE',
    });

    const params = Promise.resolve({ id: userId });
    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
