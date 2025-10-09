// /lib/db/auth.ts
import { prisma } from './prisma';
import { createHash } from "crypto";

// ----------------------------------------------------
// 类型定义
// ----------------------------------------------------
export type UserData = {
  success: true;
  id: string;
  name: string;
  role: string;
};

export type UserNotFound = {
  success: false;
};

export type UserAuthResult = UserData | UserNotFound;

// ----------------------------------------------------
// 工具函数
// ----------------------------------------------------

/**
 * 生成唯一 ID
 */
function generateId(data: string): string {
  return createHash("sha256")
    .update(data)
    .digest("hex")
    .substring(0, 32);
}

// ----------------------------------------------------
// 数据库查询函数
// ----------------------------------------------------

/**
 * 检查用户是否存在（使用 Prisma）
 */
export async function checkUserExists(address: string): Promise<UserAuthResult> {
  try {
    const normalizedAddress = address.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { id: true, nickname: true, role: true },
    });

    if (user) {
      return {
        success: true,
        id: user.id,
        name: user.nickname,
        role: user.role || "user", // 使用数据库中的role，默认为"user"
      };
    }

    return { success: false };
  } catch (error) {
    console.error("Database query error in checkUserExists:", error);
    return { success: false };
  }
}

/**
 * 自动注册用户（直接使用 Prisma，避免调用 API）
 */
export async function autoRegisterUser(address: string): Promise<UserData | null> {
  try {
    const lowerCaseAddress = address.toLowerCase();
    const id = generateId(address);
    const nickname = `User_${address.slice(-6)}`;

    const newUser = await prisma.user.create({
      data: {
        id,
        walletAddress: lowerCaseAddress,
        walletType: "polkavm",
        nickname,
        avatar: "/default-avatar.png",
        totalRoutes: 0,
        role: "user", // 明确设置role为"user"
      },
    });

    console.log("✅ 自动注册成功:", address);

    return {
      success: true,
      id: newUser.id,
      name: newUser.nickname,
      role: newUser.role,
    };
  } catch (error: any) {
    // 唯一约束冲突可能发生在并发场景
    if (error.code === "P2002" || error.name === "UniqueConstraintError") {
      console.warn("User was registered by another request:", address);
      // 再查一次
      const existing = await prisma.user.findUnique({
        where: { walletAddress: address.toLowerCase() },
        select: { id: true, nickname: true, role: true },
      });
      if (existing) {
        return {
          success: true,
          id: existing.id,
          name: existing.nickname,
          role: existing.role || "user",
        };
      }
    }
    console.error("Auto-register failed:", error);
    return null;
  }
}


/**
 * 根据用户ID获取用户信息
 */
export async function getUserById(id: string): Promise<UserData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, nickname: true, role: true, walletAddress: true },
    });

    if (!user) return null;

    return {
      success: true,
      id: user.id,
      name: user.nickname,
      role: user.role,
    };
  } catch (error) {
    console.error("getUserById error:", error);
    return null;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(
  id: string, 
  data: { nickname?: string; avatar?: string }
): Promise<UserData | null> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.nickname && { nickname: data.nickname }),
        ...(data.avatar && { avatar: data.avatar }),
      },
      select: { id: true, nickname: true, role: true },
    });

    return {
      success: true,
      id: user.id,
      name: user.nickname,
      role: user.role,
    };
  } catch (error) {
    console.error("updateUser error:", error);
    return null;
  }
}

/**
 * 检查多个地址的用户存在情况（批量查询）
 */
export async function checkUsersExist(addresses: string[]): Promise<Record<string, UserData | null>> {
  try {
    const normalizedAddresses = addresses.map(addr => addr.toLowerCase().trim());
    
    const users = await prisma.user.findMany({
      where: {
        walletAddress: { in: normalizedAddresses },
      },
      select: { id: true, nickname: true, role: true, walletAddress: true },
    });

    const result: Record<string, UserData | null> = {};
    
    normalizedAddresses.forEach(address => {
      const user = users.find(u => u.walletAddress === address);
      if (user) {
        result[address] = {
          success: true,
          id: user.id,
          name: user.nickname,
          role: user.role,
        };
      } else {
        result[address] = null;
      }
    });

    return result;
  } catch (error) {
    console.error("checkUsersExist error:", error);
    return {};
  }
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalRoutes: true,
        createdAt: true
      },
    });

    return user;
  } catch (error) {
    console.error("getUserStats error:", error);
    return null;
  }
}

// ----------------------------------------------------
// 导出类型（补充）
// ----------------------------------------------------
export type UserStats = {
  totalRoutes: number;
  createdAt: Date;
};

