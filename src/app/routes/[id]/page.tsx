'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface POI {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  taskType: string;
  taskContent: string | null;
  order: number;
}

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = params.id as string;

  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        const res = await fetch(`/api/pois?routeId=${routeId}`);
        const data = await res.json();

        if (data.success) {
          setPois(data.data);
        } else {
          setError(data.message || '获取打卡点失败');
        }
      } catch (err) {
        setError('网络请求失败');
      } finally {
        setLoading(false);
      }
    };

    if (routeId) {
      fetchPOIs();
    }
  }, [routeId]);

  if (loading) return <div className="p-6">加载打卡点中...</div>;
  if (error) return <div className="p-6 text-red-500">错误：{error}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">路线打卡点</h1>

      {pois.length === 0 ? (
        <p className="text-gray-500">该路线暂无打卡点</p>
      ) : (
        <ol className="space-y-4">
          {pois.map((poi) => (
            <li
              key={poi.id}
              className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {poi.order}. {poi.name}
              </h3>
              {poi.description && (
                <p className="text-gray-600 mt-1 text-sm">{poi.description}</p>
              )}
              <div className="text-xs text-gray-500 mt-2">
                任务类型: {poi.taskType} | 
                位置: ({poi.latitude.toFixed(6)}, {poi.longitude.toFixed(6)})
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}