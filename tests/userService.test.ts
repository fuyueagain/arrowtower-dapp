// userService.test.ts

// ✅ 1. 先 mock Prisma（必须在所有 import 之前！）
jest.mock('../src/lib/db/prisma', () => {
  const { PrismaClient } = require('@prisma/client');

  const prisma = new PrismaClient({
    datasourceUrl: 'file:../data/arrowtower_test.db', // 确保路径正确
  });

  return { prisma };
});

// ✅ 2. 导入业务逻辑（必须在 mock 之后）
import {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from '@/lib/db/userService';

// ✅ 3. 工具函数：清空数据库
async function clearDatabase() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasourceUrl: 'file:../data/arrowtower_test.db',
  });
  try {
    await prisma.$executeRaw `PRAGMA foreign_keys = OFF`;
    await prisma.user.deleteMany({});
    await prisma.$executeRaw `PRAGMA foreign_keys = ON`;
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ 4. 测试用例
describe('UserService CRUD Tests', () => {
  const mockUser = {
    id: 'test-user-001',
    walletAddress: '0x123456789abcdef0000000000000000000000000',
    walletType: 'metamask',
    nickname: 'Alice',
    avatar: 'https://example.com/avatar.png',
    role: 'user',
    totalRoutes: 5,
  };

/*   beforeAll(async () => {
    await clearDatabase();
  });
 */
  afterAll(async () => {
    // 断开 mock 中使用的 prisma 连接
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasourceUrl: 'file:../data/arrowtower_test.db',
    });
    await prisma.$disconnect();
  });

  test('should create a new user', async () => {
    const response = await createUser(mockUser);
    expect(response.success).toBe(true);
    expect(response.data).toMatchObject({
      id: mockUser.id,
      walletAddress: mockUser.walletAddress,
      nickname: mockUser.nickname,
    });
  });

  test('should retrieve user by id', async () => {
    const response = await getUserById(mockUser.id);
    expect(response.success).toBe(true);
    expect(response.data).not.toBeNull();
    expect(response.data?.nickname).toBe(mockUser.nickname);
  });

  test('should update user nickname', async () => {
    const updatedData = { nickname: 'Alice_W' };
    const response = await updateUser(mockUser.id, updatedData);
    expect(response.success).toBe(true);
    expect(response.data?.nickname).toBe(updatedData.nickname);
  });

  test('should delete user', async () => {
    const deleteResponse = await deleteUser(mockUser.id);
    expect(deleteResponse.success).toBe(true); // 假设删除成功返回 { success: true }

    const getResponse = await getUserById(mockUser.id);
   // expect(getResponse.data).toBeNull(); // 或者 getResponse.success === false
  });

  test('should handle non-existent user update', async () => {
    const response = await updateUser('non-existent-id', { nickname: 'NoOne' });
    expect(response.success).toBe(false);
    // 或者如果你抛出异常，才用 expect().rejects.toThrow()
  });
});