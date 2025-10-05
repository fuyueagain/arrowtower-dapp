import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  /**
   * 扩展 Session 对象的类型
   */
  interface Session {
    user: {
      id: string;
      address: string;
      status: string;
      role: "admin" | "user"; // <-- 添加自定义角色
    } & DefaultSession["user"]; // 保留默认属性
  }

  /**
   * 扩展 User 对象的类型 (从 authorize 返回)
   */
  interface User {
    id: string;
    address: string;
    status: string;
    role: "admin" | "user"; // <-- 添加自定义角色
  }
}

declare module "next-auth/jwt" {
  /**
   * 扩展 JWT Token 的类型
   */
  interface JWT extends DefaultJWT {
    id: string;
    address: string;
    status: string;
    role: "admin" | "user"; // <-- 添加自定义角色
  }
}