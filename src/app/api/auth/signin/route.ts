// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

// ----------------------------------------------------
// Prisma 客户端（HMR 兼容）
// ----------------------------------------------------
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ----------------------------------------------------
// 类型定义
// ----------------------------------------------------
type UserData = {
  success: true;
  id: string;
  name: string;
  role: "admin" | "user";
};

type UserNotFound = {
  success: false;
};

type UserAuthResult = UserData | UserNotFound;

// 生成唯一 ID
function generateId(data: string): string {
  return createHash("sha256")
    .update(data)
    .digest("hex")
    .substring(0, 32);
}

// ----------------------------------------------------
// 检查用户是否存在（使用 Prisma）
// ----------------------------------------------------
async function checkUserExists(address: string): Promise<UserAuthResult> {
  try {
    const normalizedAddress = address.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: { id: true, nickname: true },
    });

    if (user) {
      return {
        success: true,
        id: user.id,
        name: user.nickname,
        role: "user", // 可扩展为数据库字段
      };
    }

    return { success: false };
  } catch (error) {
    console.error("Database query error in checkUserExists:", error);
    return { success: false };
  }
}

// ----------------------------------------------------
// 自动注册用户（直接使用 Prisma，避免调用 API）
// ----------------------------------------------------
async function autoRegisterUser(address: string): Promise<UserData | null> {
  try {
    const lowerCaseAddress = address.toLowerCase();
    const id = generateId(address);
    const nickname = `User_${address.slice(-6)}`;

    const newUser = await prisma.user.create({
      data: {
        id,
        walletAddress: lowerCaseAddress,
        walletType: "evm",
        nickname,
        avatar: "/default-avatar.png",
        totalRoutes: 0,
      },
    });

    console.log("✅ 自动注册成功:", address);

    return {
      success: true,
      id: newUser.id,
      name: newUser.nickname,
      role: "user",
    };
  } catch (error: any) {
    // 唯一约束冲突可能发生在并发场景
    if (error.code === "P2002" || error.name === "UniqueConstraintError") {
      console.warn("User was registered by another request:", address);
      // 再查一次
      const existing = await prisma.user.findUnique({
        where: { walletAddress: address.toLowerCase() },
        select: { id: true, nickname: true },
      });
      if (existing) {
        return {
          success: true,
          id: existing.id,
          name: existing.nickname,
          role: "user",
        };
      }
    }
    console.error("Auto-register failed:", error);
    return null;
  }
}

// ----------------------------------------------------
// POST 处理函数
// ----------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (e) {
      return NextResponse.json(
        { status: "error", message: "Invalid JSON" },
        { status: 400 }
      );
    }

    const { address, signature } = requestBody;

    if (!address || !signature) {
      return NextResponse.json(
        { status: "error", message: "Missing address or signature" },
        { status: 400 }
      );
    }

    // ✅ 1. 验证签名
    const message = "login arrowtower";
    let isValidSignature = false;

    try {
      isValidSignature = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (e) {
      console.error("Signature verification failed:", e);
      return NextResponse.json(
        { status: "error", message: "Invalid signature format" },
        { status: 401 }
      );
    }

    if (!isValidSignature) {
      return NextResponse.json(
        { status: "error", message: "Invalid signature" },
        { status: 401 }
      );
    }

    // ✅ 2. 检查用户是否存在
    let user = await checkUserExists(address);

    if (user.success === false) {
      console.log("👤 用户不存在，尝试自动注册:", address);

      // ✅ 使用 Prisma 直接注册（不再 fetch API）
      const registeredUser = await autoRegisterUser(address);
      if (!registeredUser) {
        return NextResponse.json(
          { status: "register_failed", message: "Failed to register user" },
          { status: 500 }
        );
      }

      user = registeredUser;
    }

    // ✅ 3. 登录成功
    return NextResponse.json({
      status: "approved",
      token: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json(
      { status: "error", message: "Server error" },
      { status: 500 }
    );
  }
}