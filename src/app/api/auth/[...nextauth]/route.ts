// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
type Role = "admin" | "user";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    address: string;
    status: string;
    role: Role;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    address: string;
    status: string;
    role: Role;
  }
}

// 生成唯一 ID（用于自动注册）
function generateId(data: string): string {
  return createHash("sha256")
    .update(data)
    .digest("hex")
    .substring(0, 32);
}

// ----------------------------------------------------
// 检查用户是否存在或自动注册
// ----------------------------------------------------
async function getUserOrRegister(address: string): Promise<User | null> {
  const lowerCaseAddress = address.toLowerCase();

  try {
    // 先查询
    let user = await prisma.user.findUnique({
      where: { walletAddress: lowerCaseAddress },
      select: { id: true, nickname: true, role: true },
    });

    if (user) {
      return {
        id: user.id,
        name: user.nickname,
        address: lowerCaseAddress,
        status: "approved",
        role: user.role as Role,
      };
    }

    // 用户不存在 → 自动注册
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
      select: { id: true, nickname: true, role: true },
    });

    console.log("✅ 自动注册用户:", address);

    return {
      id: newUser.id,
      name: newUser.nickname,
      address: lowerCaseAddress,
      status: "approved",
      role: newUser.role as Role,
    };
  } catch (error: any) {
    console.error("数据库操作失败:", error);
    return null;
  }
}

// 👇 将 NextAuth 配置提取为可导出的 authOptions
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum Wallet",
      credentials: {
        address: { label: "Wallet Address", type: "text", placeholder: "0x..." },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.address || !credentials?.signature) {
            console.warn("[AUTH] 缺少地址或签名");
            return null;
          }

          const message = "login arrowtower";
          const address = credentials.address as `0x${string}`;
          const signature = credentials.signature as `0x${string}`;

          // ✅ 验证签名
          const isValidSignature = await verifyMessage({ address, message, signature });
          if (!isValidSignature) {
            console.warn("[AUTH] 签名无效:", address);
            return null;
          }

          // ✅ 获取用户（不存在则自动注册）
          const user = await getUserOrRegister(address);
          if (!user) {
            console.error("[AUTH] 获取/注册用户失败:", address);
            return null;
          }

          console.log("[AUTH] 认证成功:", user.name);
          return user;
        } catch (error) {
          console.error("[AUTH] 认证过程出错:", error);
          return null;
        }
      },
    }),
  ],

  // ----------------------------------------------------
  // JWT 回调：将用户信息写入 token
  // ----------------------------------------------------
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.address = user.address;
        token.status = user.status;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.address = token.address;
        session.user.status = token.status;
        session.user.role = token.role;
      }
      return session;
    },
  },

  // ----------------------------------------------------
  // 其他配置
  // ----------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin", // 可选：自定义登录页
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
};

// 创建处理程序
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions }; // ✅ 导出供其他 API 使用