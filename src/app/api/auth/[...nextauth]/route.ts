// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyMessage } from "viem";

// ----------------------------------------------------
// 1. 定义用户认证结果类型，修复TS2339
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

type Role = "admin" | "user";

type UserAuthResult = UserData | UserNotFound;

// **模拟** checkWalletAuth 函数
// 实际应用中你需要实现一个真正的数据库查询函数
const MOCK_USERS: Record<string, UserAuthResult> = {
  // 模拟一个管理员地址
  "0x1AdminAddressExample": {
    success: true,
    id: "admin_user_id",
    name: "Admin User",
    role: "admin",
  },
  // 模拟一个普通用户地址
  "0x2UserAddressExample": {
    success: true,
    id: "user_id",
    name: "Regular User",
    role: "user",
  },
  // 模拟一个未找到的用户
  "0x3NotFoundAddressExample": { success: false },
};

const mockCheckWalletAuth = (address: string): UserAuthResult => {
  const normalizedAddress = address.toLowerCase().slice(0, 10);

  if (normalizedAddress.includes("1admin")) {
    return MOCK_USERS["0x1AdminAddressExample"];
  }
  if (normalizedAddress.includes("2user")) {
    return MOCK_USERS["0x2UserAddressExample"];
  }

  return MOCK_USERS["0x3NotFoundAddressExample"];
};

const handler = NextAuth({
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
            return null;
          }

          const authResult = mockCheckWalletAuth(credentials.address);

          // ----------------------------------------------------
          // 2. 修复TS2339：通过检查 success 属性来收窄类型
          // ----------------------------------------------------
          if (!authResult.success) {
            return null; // 用户未找到或注册失败
          }

          // 此时 authResult 的类型已收窄为 UserData
          const user = authResult; 

          // 签名验证
          const message = "login arrowtower";
          const isValidSignature = verifyMessage({
            address: credentials.address as `0x${string}`,
            message,
            signature: credentials.signature as `0x${string}`,
          });

          if (!isValidSignature) {
            return null;
          }

          // 成功认证，返回包含简化信息的 User 对象
          return {
            id: user.id, // TS 修复：user 确定有 id
            name: user.name, // TS 修复：user 确定有 name
            address: credentials.address,
            status: "approved",
            role: user.role, // TS 修复：user 确定有 role
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // 这里的类型问题需要通过 next-auth.d.ts 扩展模块解决
      if (user && "address" in user && "status" in user) {
        token.id = user.id as string;
        token.name = user.name as string;
        token.address = user.address as string;
        token.status = user.status as string;
        token.role = user.role as Role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // 这里的类型问题需要通过 next-auth.d.ts 扩展模块解决
      if (session.user) {
        const user = session.user as unknown as { id:string; name:string; address: string;role:string; status: string };
        user.id = token.id as string;
        user.name = token.name as string;
        user.address = token.address as string;
        user.status = token.status as string;
        user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };