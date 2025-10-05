// app/user/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 保护路由：如果用户未登录，则重定向
  useEffect(() => {
    if (status === "loading") return; // 等待会话加载
    
    // 如果未登录，重定向到首页
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]); // 这里的依赖项已简化

  // 在 session 加载中或未认证时，显示加载/重定向状态
  // **注意:** 我们不再需要检查 status === "unauthenticated" 因为 useEffect 已经处理了重定向
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">加载中...</p>
      </div>
    );
  }

  // 1. 明确的退出条件检查：如果 status 是 authenticated，但 session 仍为 null (极少见但可能)，则回退到重定向
  if (!session) {
      router.push("/");
      return null;
  }
  
  // 此时 session 确定存在，但我们仍然使用可选链来避免访问 session.user 时的 TS 警告

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-4">
          🌐 User Profile
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          你好,{" "}
          <span className="font-semibold text-blue-600">
            {/* 修复点 1: 使用可选链 ?. 和空值合并 ?? 确保安全访问 */}
            {session.user?.name || session.user?.address || "用户"} 
          </span>
          ! 这是你的专属区域。
        </p>

        <div className="text-left bg-blue-50 p-4 rounded-md mb-8 border border-blue-200">
          <h2 className="text-lg font-bold text-blue-800 mb-2">会话信息 (JWT Claims)</h2>
          <p className="text-sm">
            {/* 修复点 2: 使用可选链安全访问 role */}
            <strong>Role:</strong> <span className="font-mono text-blue-600">{session.user?.role}</span>
          </p>
          <p className="text-sm truncate">
            {/* 修复点 3: 使用可选链安全访问 address */}
            <strong>Address:</strong> <span className="font-mono">{session.user?.address}</span>
          </p>
          <p className="text-sm truncate">
            {/* 修复点 4: 使用可选链安全访问 id */}
            <strong>User ID:</strong> <span className="font-mono">{session.user?.id}</span>
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-150"
        >
          登出
        </button>
      </div>
    </div>
  );
}