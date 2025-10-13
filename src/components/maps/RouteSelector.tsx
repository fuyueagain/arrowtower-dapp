'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Route {
  id: string;
  name: string;
  description: string | null;
  poiCount: number;
}

interface RouteSelectorProps {
  routes: Route[];
  selectedRoute: string;
  onSelectRoute: (routeId: string) => void;
  completedCount?: number;
}

export function RouteSelector({ 
  routes, 
  selectedRoute, 
  onSelectRoute,
  completedCount = 0 
}: RouteSelectorProps) {
  if (routes.length === 0) {
    return null;
  }

  // 如果只有一个路线，显示卡片样式
  if (routes.length === 1) {
    const route = routes[0];
    return (
      <Card className="p-5 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
        <h3 className="font-bold mb-3 text-emerald-900">🛤️ 当前路线</h3>
        <div className="space-y-2 text-sm">
          <p className="font-bold text-emerald-700 text-lg">{route.name}</p>
          <p className="text-gray-700">{route.description}</p>
          <div className="flex items-center gap-2 pt-2">
            <Badge className="bg-emerald-600 text-white">
              共 {route.poiCount} 个打卡点
            </Badge>
            <Badge variant="outline" className="border-green-600 text-green-700">
              已完成 {completedCount} 个
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  // 多个路线时显示选择器
  return (
    <Card className="p-5 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
      <h3 className="font-bold mb-4 text-emerald-900">🛤️ 选择探索路线</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => onSelectRoute(route.id)}
            className={`
              p-4 rounded-lg border-2 text-left transition-all duration-200
              ${selectedRoute === route.id 
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-600 shadow-lg scale-105' 
                : 'bg-white hover:bg-emerald-50 text-gray-800 border-gray-200 hover:border-emerald-400 hover:shadow-md'
              }
            `}
          >
            <div className="space-y-2">
              <p className={`font-bold text-base ${selectedRoute === route.id ? 'text-white' : 'text-emerald-700'}`}>
                {route.name}
              </p>
              {route.description && (
                <p className={`text-xs line-clamp-2 ${selectedRoute === route.id ? 'text-emerald-50' : 'text-gray-600'}`}>
                  {route.description}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Badge 
                  className={selectedRoute === route.id 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'bg-emerald-100 text-emerald-700'
                  }
                >
                  {route.poiCount} 个景点
                </Badge>
                {selectedRoute === route.id && completedCount > 0 && (
                  <Badge className="bg-white/20 text-white border border-white/30">
                    已完成 {completedCount}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

