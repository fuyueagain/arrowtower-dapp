'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface POI {
  id: string;
  name: string;
  description: string;
  order: number;
  taskType: string;
  taskContent: string | null;
}

interface POIDetailModalProps {
  open: boolean;
  onClose: () => void;
  poiNumber: string;
  imageUrl: string;
  poiData?: POI | null;
  onCheckin: () => void;
  isLoading?: boolean;
  isCompleted?: boolean; // 是否已打卡
}

export function POIDetailModal({
  open,
  onClose,
  poiNumber,
  imageUrl,
  poiData,
  onCheckin,
  isLoading = false,
  isCompleted = false,
}: POIDetailModalProps) {
  // 箭塔介绍使用特殊布局
  const isArrowTower = poiNumber === '0';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className={cn(
          // 基础样式
          "overflow-auto",
          // 移动端优化：确保居中和适配
          "w-[95vw] sm:w-[90vw]",
          // 箭塔介绍：较窄的布局
          isArrowTower && "max-w-3xl max-h-[90vh]",
          // 其他景点：响应式宽度
          !isArrowTower && "md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh]"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-emerald-900">
            {poiData ? poiData.name : `景点 ${poiNumber}`}
          </DialogTitle>
        </DialogHeader>
        
        {/* 箭塔介绍：上下布局 */}
        {isArrowTower ? (
          <div className="space-y-4">
            {/* 上：图片 */}
            <div className="relative w-full bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl overflow-hidden shadow-md border-2 border-emerald-100">
              <img
                src={imageUrl}
                alt={poiData?.name || `景点 ${poiNumber}`}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  console.error('图片加载失败:', imageUrl);
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%2310b981"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="20">图片加载失败</text></svg>';
                }}
              />
            </div>

            {/* 下：文字描述 + 按钮 */}
            <div className="space-y-4">
              {poiData && (
                <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-lg">
                  <p className="text-base text-gray-700 leading-relaxed text-justify">{poiData.description}</p>
                </Card>
              )}
              
              <Button
                size="lg"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg"
              >
                关闭
              </Button>
            </div>
          </div>
        ) : (
          /* 其他景点：左右布局 */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：景点详细图片 */}
          <div className="relative w-full bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl overflow-hidden shadow-md border-2 border-emerald-100">
            <img
              src={imageUrl}
              alt={poiData?.name || `景点 ${poiNumber}`}
              className="w-full h-auto object-cover"
              onError={(e) => {
                console.error('图片加载失败:', imageUrl);
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%2310b981"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="20">图片加载失败</text></svg>';
              }}
            />
          </div>

          {/* 右侧：POI 信息 */}
          <div className="flex flex-col justify-between space-y-4">
            {/* POI 描述 - 只显示描述 */}
            {poiData && (
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-lg flex-1 flex items-center">
                <p className="text-base text-gray-700 leading-relaxed">{poiData.description}</p>
              </Card>
            )}

            {/* 打卡按钮 - 箭塔介绍不需要打卡 */}
            {poiNumber !== '0' ? (
              <div className="space-y-3">
                {isCompleted ? (
                  /* 已打卡状态 */
                  <>
                    <Button
                      className="w-full bg-gray-400 text-gray-200 font-bold shadow-lg cursor-not-allowed"
                      size="lg"
                      disabled
                    >
                      ✓ 已打卡
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={onClose}
                      className="w-full border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                    >
                      关闭
                    </Button>
                    <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        ✓ 您已在此景点完成打卡
                      </p>
                    </Card>
                  </>
                ) : (
                  /* 未打卡状态 */
                  <>
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg"
                      size="lg"
                      onClick={onCheckin}
                      disabled={isLoading}
                    >
                      {isLoading ? '处理中...' : '✓ 立即打卡'}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={onClose}
                      className="w-full border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                    >
                      取消
                    </Button>
                    
                    {/* 打卡说明 */}
                    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                      <h4 className="font-bold text-xs mb-2 text-emerald-900 flex items-center">
                        <span className="mr-1">📍</span> 打卡说明
                      </h4>
                      <ul className="text-xs text-emerald-700 space-y-1">
                        <li className="flex items-start"><span className="mr-1">•</span><span>需要连接钱包并签名确认</span></li>
                        <li className="flex items-start"><span className="mr-1">•</span><span>确保已开启定位权限</span></li>
                        <li className="flex items-start"><span className="mr-1">•</span><span>每个景点只能打卡一次</span></li>
                      </ul>
                    </Card>
                  </>
                )}
              </div>
            ) : (
              <Button
                size="lg"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg"
              >
                关闭
              </Button>
            )}
          </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

