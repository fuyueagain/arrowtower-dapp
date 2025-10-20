import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

// 用户查询响应类型
export interface UserResponse {
  id: string;
  walletAddress: string;
  walletType: string;
  nickname: string;
  role: string;
  avatar: string | null;
  totalRoutes: number;
  createdAt: Date;
}

// 创建用户输入类型
export interface CreateUserInput {
  id: string;
  walletAddress: string;
  walletType: string;
  nickname: string;
  avatar?: string;
}

// 更新用户输入类型
export interface UpdateUserInput {
  nickname?: string;
  avatar?: string;
  role?: string;
}

// 通用返回结果类型
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 创建新用户
 */
export async function createUser(
  input: CreateUserInput
): Promise<OperationResult<UserResponse>> {
  try {
    const user = await prisma.user.create({
      data: {
        id: input.id,
        walletAddress: input.walletAddress,
        walletType: input.walletType,
        nickname: input.nickname,
        avatar: input.avatar || 'default-avatar.png',
      },
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          message: '钱包地址已存在',
        };
      }
    }
    console.error('创建用户失败:', error);
    return {
      success: false,
      message: '服务器错误，创建用户失败',
    };
  }
}

/**
 * 根据用户ID查询用户信息
 */
export async function getUserById(
  id: string
): Promise<OperationResult<UserResponse>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('查询用户失败:', error);
    return {
      success: false,
      message: '服务器错误，查询用户失败',
    };
  }
}

/**
 * 根据钱包地址查询用户
 */
export async function getUserByWalletAddress(
  walletAddress: string
): Promise<OperationResult<UserResponse>> {
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('查询用户失败:', error);
    return {
      success: false,
      message: '服务器错误，查询用户失败',
    };
  }
}

/**
 * 查询所有用户（支持分页）
 */
export async function getUsers(
  page = 1,
  pageSize = 10
): Promise<OperationResult<{ users: UserResponse[] }>> {
  try {
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    // 这里我们返回一个标准化结构（便于路由层或调用方直接使用）
    return {
      success: true,
      data: {
        users,
      },
      total,
      page,
      pageSize,
    } as any;
  } catch (error) {
    console.error('查询用户列表失败:', error);
    return {
      success: false,
      message: '服务器错误，查询用户列表失败',
    };
  }
}
/**
 * 更新用户信息
 */
export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<OperationResult<UserResponse>> {
  try {
    const updateData: Prisma.UserUpdateInput = {};

    if (input.nickname !== undefined) updateData.nickname = input.nickname;
    if (input.avatar !== undefined) updateData.avatar = input.avatar;
    if (input.role !== undefined) updateData.role = input.role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: '用户不存在，更新失败',
        };
      }
    }
    console.error('更新用户失败:', error);
    return {
      success: false,
      message: '服务器错误，更新用户失败',
    };
  }
}

/**
 * 删除用户（谨慎使用）
 */
export async function deleteUser(
  id: string
): Promise<OperationResult> {
  try {
    await prisma.user.delete({
      where: { id },
    });

    return {
      success: true,
      message: '用户删除成功',
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: '用户不存在，删除失败',
        };
      }
    }
    console.error('删除用户失败:', error);
    return {
      success: false,
      message: '服务器错误，删除用户失败',
    };
  }
}

/**
 * 增加用户完成的路线数
 */
export async function incrementUserTotalRoutes(
  id: string
): Promise<OperationResult<UserResponse>> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        totalRoutes: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return {
          success: false,
          message: '用户不存在',
        };
      }
    }
    console.error('增加完成路线数失败:', error);
    return {
      success: false,
      message: '服务器错误，操作失败',
    };
  }
}