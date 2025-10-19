"use client";
// app/admin/users/page.tsx
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  walletAddress: string;
  walletType: string;
  nickname: string;
  role: string;
  avatar: string | null;
  totalRoutes: number;
  createdAt: string;
}

interface UsersResponse {
  success: boolean;
  data?: {
    users: User[];
    total: number;
  };
  message?: string;
}

interface CreateUserInput {
  id: string;
  walletAddress: string;
  walletType: string;
  nickname: string;
  avatar?: string;
  role: string;
}

interface UpdateUserInput {
  nickname?: string;
  avatar?: string;
  role?: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 模态框控制
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"create" | "update">("create");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // 表单数据
  const [form, setForm] = useState<CreateUserInput>({
    id: "",
    walletAddress: "",
    walletType: "metamask",
    nickname: "",
    avatar: "",
    role: "user",
  });

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("获取用户失败");

      const result: UsersResponse = await res.json();
      if (result.success) {
        setUsers(result.data!.users);
        setTotal(result.data!.total);
      } else {
        setError(result.message || "未知错误");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || session?.user?.role !== "admin") {
      router.push("/");
    } else {
      fetchUsers();
    }
  }, [status, session, router]);

  // 打开新增模态框
  const handleCreate = () => {
    setModalType("create");
    setForm({
      id: crypto.randomUUID(), // 自动生成 ID
      walletAddress: "",
      walletType: "metamask",
      nickname: "",
      avatar: "",
      role: "user",
    });
    setIsModalOpen(true);
  };

  // 打开编辑模态框
  const handleEdit = (user: User) => {
    setModalType("update");
    setCurrentUserId(user.id);
    setForm({
      id: user.id,
      walletAddress: user.walletAddress,
      walletType: user.walletType,
      nickname: user.nickname,
      avatar: user.avatar || "",
      role: user.role,
    });
    setIsModalOpen(true);
  };

  // 删除用户
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个用户吗？此操作不可恢复！")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("删除成功");
        fetchUsers(); // 刷新列表
      } else {
        const data = await res.json();
        alert(`删除失败: ${data.message}`);
      }
    } catch (err: any) {
      alert("网络错误: " + err.message);
    }
  };

  // 提交表单（创建或更新）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = modalType === "create"
        ? "/api/admin/users"
        : `/api/admin/users/${currentUserId}`;

      const method = modalType === "create" ? "POST" : "PUT";

      const body = modalType === "create"
        ? form
        : { nickname: form.nickname, avatar: form.avatar, role: form.role };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert(modalType === "create" ? "创建成功" : "更新成功");
        setIsModalOpen(false);
        fetchUsers(); // 刷新列表
      } else {
        const data = await res.json();
        alert(`操作失败: ${data.message}`);
      }
    } catch (err: any) {
      alert("网络错误: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || (session?.user?.role === "admin" && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">加载中...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-600">无权访问此页面。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold text-red-600">👥 用户管理</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            ➕ 新增用户
          </button>
        </div>
        <p className="text-lg text-gray-700 mb-8">共 {total} 名注册用户</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            错误：{error}
          </div>
        )}

        {users.length === 0 ? (
          <p className="text-gray-500">暂无用户数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">头像</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">昵称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">钱包地址</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完成路线</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={user.avatar || "/default-avatar.png"}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.nickname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">
                      {user.walletAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.totalRoutes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => router.push("/admin")}
          className="mt-6 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
        >
          返回管理首页
        </button>
      </div>

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {modalType === "create" ? "新增用户" : "编辑用户"}
            </h2>
            <form onSubmit={handleSubmit}>
              {modalType === "create" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">用户ID</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">钱包地址</label>
                <input
                  type="text"
                  value={form.walletAddress}
                  onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">钱包类型</label>
                <select
                  value={form.walletType}
                  onChange={(e) => setForm({ ...form, walletType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                >
                  <option value="metamask">MetaMask</option>
                  <option value="phantom">Phantom</option>
                  <option value="walletconnect">WalletConnect</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">昵称</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">头像URL</label>
                <input
                  type="text"
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                  placeholder="可选"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">角色</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {modalType === "create" ? "创建" : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}