'use client';

import { useEffect, useState } from 'react';

// 定义类型（与 API 响应一致）
interface UserProgress {
  completedPOIs: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface RouteItem {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  difficulty: string;
  estimatedTime: number;
  poiCount: number;
  isActive: boolean;
  userProgress: UserProgress;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface RoutesResponse {
  success: boolean;
  data: {
    routes: RouteItem[];
    pagination: Pagination;
  };
  timestamp: string;
}

export default function RoutesPage() {
  const [data, setData] = useState<RoutesResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          difficulty: 'medium',
          isActive: 'true',
        });

        const res = await fetch(`/api/route_list?${params}`);

        if (!res.ok) {
          throw new Error('网络请求失败');
        }

        const result: RoutesResponse = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError('数据加载失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (loading) return <div className="p-6">加载中...</div>;
  if (error) return <div className="p-6 text-red-500">错误: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">探索路线</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.routes.map((route) => (
          <div
            key={route.id}
            className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {route.coverImage ? (
              <img
                src={route.coverImage}
                alt={route.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-t-lg">
                <span className="text-gray-500">无图片</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-800">{route.name}</h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {route.description || '暂无描述'}
              </p>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <div>
                  难度: <span className="capitalize">{route.difficulty}</span>
                </div>
                <div>预计时长: {route.estimatedTime} 分钟</div>
                <div>点位数量: {route.poiCount}</div>
              </div>
              <div className="mt-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    route.userProgress.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : route.userProgress.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {route.userProgress.status === 'completed'
                    ? '已完成'
                    : route.userProgress.status === 'in_progress'
                    ? '进行中'
                    : '未开始'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        共 {data?.pagination.total} 条路线，第 {data?.pagination.page} /{' '}
        {data?.pagination.pages} 页
      </div>
    </div>
  );
}