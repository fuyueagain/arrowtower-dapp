'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CheckinResult {
  success: boolean;
  data?: {
    poi: {
      name: string;
      order: number;
    };
    routeProgress: {
      completed: number;
      total: number;
      nextPOI: { id: string; name: string } | null;
      isRouteCompleted: boolean;
      completedPOIs?: Array<{ name: string; order: number }>; // 已完成的POI列表
    };
    nftStatus: {
      willMint: boolean;
      remainingPOIs: number;
    };
  };
  message?: string;
}

interface CheckinProgressProps {
  result: CheckinResult | null;
  completedPOIs?: Array<{ name: string; order: number }>; // 从父组件传入的已完成列表
}

export function CheckinProgress({ result, completedPOIs = [] }: CheckinProgressProps) {
  if (!result) return null;

  const isRouteCompleted = result.data?.routeProgress.isRouteCompleted || false;
  const willMint = result.data?.nftStatus.willMint || false;

  return (
    <Card className={`p-6 ${
      result.success ? 'border-l-4 border-emerald-500' : 'border-l-4 border-red-500'
    }`}>
      <h3 className="text-lg font-bold mb-4 text-emerald-900">
        {result.success ? '✅ 打卡成功' : '❌ 打卡失败'}
      </h3>
      
      {result.success && result.data && (
        <div className="space-y-4">
          {/* 打卡点信息 */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200">
            <p className="text-base text-emerald-800 font-semibold">
              📍 {result.data.poi.name} <span className="text-sm text-emerald-600">(第 {result.data.poi.order} 站)</span>
            </p>
          </div>

          {/* 路线进度 */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3">🛤️ 路线进度</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700 font-medium">
                已完成 {result.data.routeProgress.completed} / {result.data.routeProgress.total}
              </span>
              <Badge 
                className={isRouteCompleted ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}
              >
                {isRouteCompleted ? '已完成' : '进行中'}
              </Badge>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(result.data.routeProgress.completed / result.data.routeProgress.total) * 100}%` 
                }}
              ></div>
            </div>
            
            {/* 已打卡的景点列表 */}
            {completedPOIs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-2">✓ 已打卡景点：</p>
                <div className="flex flex-wrap gap-1.5">
                  {completedPOIs.map((poi, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs border-emerald-400 text-emerald-700 bg-emerald-50"
                    >
                      {poi.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 下一个打卡点或完成提示 */}
          {isRouteCompleted || willMint ? (
            <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg border-2 border-emerald-300">
              <h4 className="font-bold text-emerald-900 mb-2 text-lg">🎉 恭喜！</h4>
              <p className="text-base text-emerald-800 font-medium">
                已完成所有打卡点{willMint && '，NFT 奖励即将发放'}！
              </p>
            </div>
          ) : result.data.routeProgress.nextPOI && (
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300">
              <h4 className="font-bold text-yellow-900 mb-2">📍 下一个打卡点</h4>
              <p className="text-base text-yellow-800 font-medium">
                {result.data.routeProgress.nextPOI.name}
              </p>
            </div>
          )}
        </div>
      )}

      {!result.success && (
        <p className="text-red-600 font-medium">{result.message || '打卡失败，请重试'}</p>
      )}
    </Card>
  );
}

