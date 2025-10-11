'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// 点位配置
export interface MapPoint {
  id: string;
  name: string;
  description?: string;
  svgElementId: string;  // SVG 中文字元素的 ID
  detailImageUrl: string; // 对应的详细图片路径
  order: number;
}

interface InteractiveMapViewerProps {
  mapSvgUrl: string;      // 主地图 SVG 路径
  points: MapPoint[];     // 点位配置
  className?: string;
}

export function InteractiveMapViewer({ 
  mapSvgUrl, 
  points,
  className 
}: InteractiveMapViewerProps) {
  const [loadedSvg, setLoadedSvg] = useState<string>('');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // 加载主地图 SVG
  useEffect(() => {
    if (mapSvgUrl) {
      fetch(mapSvgUrl)
        .then(res => res.text())
        .then(text => setLoadedSvg(text))
        .catch(err => console.error('加载地图失败:', err));
    }
  }, [mapSvgUrl]);

  // 为 SVG 元素添加交互
  useEffect(() => {
    if (!svgContainerRef.current || !loadedSvg) return;

    const container = svgContainerRef.current;

    // 为每个点位添加事件监听
    points.forEach(point => {
      const element = container.querySelector(`#${point.svgElementId}`);
      if (!element) {
        console.warn(`未找到元素: #${point.svgElementId}`);
        return;
      }

      if (element instanceof SVGElement) {
        // 设置基础样式
        element.style.cursor = 'pointer';
        element.style.transition = 'all 0.3s ease';
        
        // 保存原始颜色
        const originalFill = window.getComputedStyle(element).fill;
        const originalOpacity = element.style.opacity || '1';

        // 鼠标悬停效果
        const handleMouseEnter = () => {
          setHoveredPoint(point.id);
          element.style.fill = '#3b82f6'; // 蓝色高亮
          element.style.opacity = '1';
          element.style.transform = 'scale(1.1)';
          element.style.transformOrigin = 'center';
        };

        const handleMouseLeave = () => {
          setHoveredPoint(null);
          element.style.fill = originalFill;
          element.style.opacity = originalOpacity;
          element.style.transform = 'scale(1)';
        };

        // 点击事件 - 打开详细图片
        const handleClick = () => {
          setSelectedPoint(point);
          console.log('点击了点位:', point);
        };

        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('click', handleClick);

        // 清理函数
        return () => {
          element.removeEventListener('mouseenter', handleMouseEnter);
          element.removeEventListener('mouseleave', handleMouseLeave);
          element.removeEventListener('click', handleClick);
        };
      }
    });
  }, [loadedSvg, points]);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* 主地图容器 */}
      <Card className="p-4 relative overflow-hidden bg-white">
        {loadedSvg ? (
          <div 
            ref={svgContainerRef}
            className="relative w-full"
            dangerouslySetInnerHTML={{ __html: loadedSvg }}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-muted-foreground">加载地图中...</p>
            </div>
          </div>
        )}

        {/* 悬停提示 */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 z-10">
            <Card className="p-3 shadow-lg animate-in fade-in slide-in-from-top-2 bg-white">
              {(() => {
                const point = points.find(p => p.id === hoveredPoint);
                if (!point) return null;
                return (
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{point.name}</p>
                    {point.description && (
                      <p className="text-xs text-muted-foreground">
                        {point.description}
                      </p>
                    )}
                    <p className="text-xs text-blue-600">点击查看详情</p>
                  </div>
                );
              })()}
            </Card>
          </div>
        )}
      </Card>

      {/* 点位列表 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">地图点位</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {points.map(point => (
            <Button
              key={point.id}
              variant="outline"
              size="sm"
              onClick={() => setSelectedPoint(point)}
              className="justify-start"
            >
              <span className="mr-2">{point.order}</span>
              {point.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* 详细图片对话框 */}
      <Dialog open={!!selectedPoint} onOpenChange={(open) => !open && setSelectedPoint(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedPoint?.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPoint(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPoint && (
            <div className="space-y-4">
              {selectedPoint.description && (
                <p className="text-muted-foreground">{selectedPoint.description}</p>
              )}
              
              {/* 详细图片 */}
              <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedPoint.detailImageUrl}
                  alt={selectedPoint.name}
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error('图片加载失败:', selectedPoint.detailImageUrl);
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280">图片加载失败</text></svg>';
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentIndex = points.findIndex(p => p.id === selectedPoint.id);
                    if (currentIndex > 0) {
                      setSelectedPoint(points[currentIndex - 1]);
                    }
                  }}
                  disabled={points.findIndex(p => p.id === selectedPoint.id) === 0}
                >
                  上一个
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentIndex = points.findIndex(p => p.id === selectedPoint.id);
                    if (currentIndex < points.length - 1) {
                      setSelectedPoint(points[currentIndex + 1]);
                    }
                  }}
                  disabled={points.findIndex(p => p.id === selectedPoint.id) === points.length - 1}
                >
                  下一个
                </Button>
                <Button
                  className="ml-auto"
                  onClick={() => setSelectedPoint(null)}
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

