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
}

export function CheckinProgress({ result }: CheckinProgressProps) {
  if (!result) return null;

  return (
    <Card className={`p-6 ${
      result.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
    }`}>
      <h3 className="text-lg font-semibold mb-4">
        {result.success ? '✅ 打卡成功' : '❌ 打卡失败'}
      </h3>
      
      {result.success && result.data && (
        <div className="space-y-4">
          {/* 打卡点信息 */}
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              打卡点: {result.data.poi.name} (第 {result.data.poi.order} 站)
            </p>
          </div>

          {/* 路线进度 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">路线进度</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700">
                已完成 {result.data.routeProgress.completed} / {result.data.routeProgress.total}
              </span>
              <Badge variant={result.data.routeProgress.isRouteCompleted ? 'default' : 'secondary'}>
                {result.data.routeProgress.isRouteCompleted ? '已完成' : '进行中'}
              </Badge>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(result.data.routeProgress.completed / result.data.routeProgress.total) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          {/* 下一个打卡点 */}
          {result.data.routeProgress.nextPOI && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">下一个打卡点</h4>
              <p className="text-sm text-yellow-700">
                {result.data.routeProgress.nextPOI.name}
              </p>
            </div>
          )}

          {/* NFT 奖励 */}
          {result.data.nftStatus.willMint && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-1">🎉 恭喜！</h4>
              <p className="text-sm text-purple-700">
                已完成路线，即将发放 NFT 奖励
              </p>
            </div>
          )}
        </div>
      )}

      {!result.success && (
        <p className="text-red-600">{result.message || '打卡失败，请重试'}</p>
      )}
    </Card>
  );
}

