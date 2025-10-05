// app/admin/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 保护路由：如果用户未登录或不是管理员，则重定向
  useEffect(() => {
    if (status === "loading") return; // 等待会话加载
    
    // 确保 session.user 存在且 role 为 'admin'
    if (status === "unauthenticated" || session?.user?.role !== "admin") {
      // 非管理员或未登录用户，重定向到首页
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || session?.user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">加载中或重定向...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-red-600 mb-4">
          👋 Admin Dashboard
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          欢迎,{" "}
          <span className="font-semibold text-red-600">
            {session.user.name || session.user.address}
          </span>
          !
        </p>

        <div className="text-left bg-red-50 p-4 rounded-md mb-8 border border-red-200">
          <h2 className="text-lg font-bold text-red-800 mb-2">会话信息 (JWT Claims)</h2>
          <p className="text-sm">
            <strong>Role:</strong> <span className="font-mono text-red-600">{session.user.role}</span>
          </p>
          <p className="text-sm truncate">
            <strong>Address:</strong> <span className="font-mono">{session.user.address}</span>
          </p>
          <p className="text-sm truncate">
            <strong>User ID:</strong> <span className="font-mono">{session.user.id}</span>
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-150"
        >
          登出
        </button>
      </div>
    </div>
  );
}