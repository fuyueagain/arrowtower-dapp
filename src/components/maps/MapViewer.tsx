'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';

// ID 到 POI 编号的映射（根据 SVG 中的实际 id 和 ref 属性）
// text 元素：可点击触发详情对话框
// path 元素：圆点，显示打卡状态（变色）
const ID_TO_POI_MAP: { [key: string]: string } = {
  'text1-9-3': '0',    // ref0 → 箭塔介绍（特殊，不可打卡）
  'text1': '2',        // ref2="111"  → img_2.svg
  'text1-3': '9',      // ref9="111"  → img_9.svg
  'text1-9': '22',     // ref22="111" → img_22.svg
  'text1-32': '11',    // ref11="111" → img_11.svg
  'text1-7': '21',     // ref21="111" → img_21.svg
  'text1-92': '20',    // ref20="111" → img_20.svg
};

// path 圆点到 POI 编号的映射（用于显示打卡进度）
const PATH_TO_POI_MAP: { [key: string]: string } = {
  'path1': '21',   // 景点21
  'path2': '2',    // 景点2
  'path3': '9',    // 景点9
  'path4': '11',   // 景点11
  'path5': '22',   // 景点22
  'path6': '20',   // 景点20
};

export interface POIInfo {
  refId: string;
  poiNumber: string;
  imageUrl: string;
}

interface MapViewerProps {
  mapSvgUrl: string;
  onPOIClick: (poiInfo: POIInfo) => void;
  routePOIs?: number[];
  completedPOIs?: Set<number>;
  className?: string;
}

export function MapViewer({ 
  mapSvgUrl, 
  onPOIClick,
  routePOIs = [],
  completedPOIs = new Set(),
  className 
}: MapViewerProps) {
  console.log('🔵 MapViewer 组件渲染，mapSvgUrl:', mapSvgUrl);
  
  const [hoveredRef, setHoveredRef] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const onPOIClickRef = useRef(onPOIClick); // 用 ref 保存回调，避免重新加载
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // 拖动状态
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 更新 ref
  useEffect(() => {
    onPOIClickRef.current = onPOIClick;
  }, [onPOIClick]);

  // 加载并设置 SVG - 一次性完成（使用 fetch 像 HTML 版本一样快）
  useEffect(() => {
    console.log('🔵 useEffect 触发，mapSvgUrl:', mapSvgUrl);
    if (!mapSvgUrl) {
      console.log('❌ useEffect 跳过: 没有 mapSvgUrl');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    console.log('🚀 开始加载 SVG:', mapSvgUrl);
    
    // 使用 fetch 而不是 XMLHttpRequest，更快！
    fetch(mapSvgUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(svgText => {
        console.log('✅ SVG 加载成功');
        
        // 获取 container（现在应该已经准备好了）
        const container = svgContainerRef.current;
        if (!container) {
          console.error('❌ container 仍然是 null');
          setError('DOM 容器未找到');
          setIsLoading(false);
          return;
        }
        
        // 直接插入 SVG
        console.log('📦 插入 SVG 到 DOM...');
        container.innerHTML = svgText;
        
        // 等待 DOM 更新后再绑定事件（和 HTML 版本一样，100ms 后）
        setTimeout(() => {
          console.log('🔧 开始绑定事件...');
          
          const svgElement = container.querySelector('svg');
          if (!svgElement) {
            console.error('❌ 未找到 SVG 元素');
            setError('SVG 元素未找到');
            setIsLoading(false);
            return;
          }
          
          console.log('✅ 找到 SVG 元素');
          
          // 移除 SVG 固有尺寸
          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');
          svgElement.style.width = '100%';
          svgElement.style.height = 'auto';
          svgElement.style.display = 'block';
          
          // 绑定所有 text 元素的事件（点击触发详情）
          const elementIds = Object.keys(ID_TO_POI_MAP);
          const handlers: Array<() => void> = [];
          
          elementIds.forEach(elementId => {
            const element = document.getElementById(elementId);
            
            if (element) {
              console.log(`✅ 找到 #${elementId}，绑定事件`);
              
              // 样式
              element.style.cursor = 'pointer';
              element.style.transition = 'all 0.3s ease';
              
              // 点击处理 - 触发详情对话框
              const handleClick = (e: MouseEvent) => {
                console.log('🎯 文字点击事件触发！', elementId);
                e.stopPropagation();
                e.preventDefault();
                
                // 调用回调（使用 ref 中的最新值）
                const poiNum = ID_TO_POI_MAP[elementId];
                console.log('🎯 调用 onPOIClick:', elementId, '→ POI', poiNum);
                onPOIClickRef.current({
                  refId: elementId,
                  poiNumber: poiNum,
                  imageUrl: poiNum === '0' ? '/arrowtower.jpg' : `/pic/svg_small/img_${poiNum}.svg`,
                });
              };
              
              // 绑定事件
              element.addEventListener('click', handleClick);
              
              // 保存清理函数
              handlers.push(() => {
                element.removeEventListener('click', handleClick);
              });
              
              console.log(`✅ #${elementId} 事件绑定完成`);
            } else {
              console.warn(`❌ 未找到 #${elementId}`);
            }
          });
          
          // 处理 path 圆点元素（显示打卡进度，不可点击）
          const pathIds = Object.keys(PATH_TO_POI_MAP);
          pathIds.forEach(pathId => {
            const pathElement = document.getElementById(pathId);
            
            if (pathElement) {
              console.log(`✅ 找到 #${pathId}，设置样式`);
              
              // 移除 pointer-events="none"，允许显示
              pathElement.removeAttribute('pointer-events');
              pathElement.style.transition = 'all 0.3s ease';
              
              // 获取 POI 信息
              const poiNumber = parseInt(PATH_TO_POI_MAP[pathId]);
              const isInRoute = routePOIs.includes(poiNumber);
              const isCompleted = completedPOIs.has(poiNumber);
              
              // 设置初始颜色
              if (isCompleted) {
                pathElement.style.fill = '#10b981'; // 绿色 - 已完成
                pathElement.style.fillOpacity = '1';
              } else if (isInRoute) {
                pathElement.style.fill = '#60a5fa'; // 蓝色 - 当前路线
                pathElement.style.fillOpacity = '0.9';
              } else {
                pathElement.style.fill = '#9ca3af'; // 灰色 - 其他景点
                pathElement.style.fillOpacity = '0.6';
              }
              
              console.log(`✅ #${pathId} → POI ${poiNumber}, 路线内:${isInRoute}, 已完成:${isCompleted}`);
            } else {
              console.warn(`❌ 未找到 #${pathId}`);
            }
          });
          
          console.log('✅ 所有事件绑定完成');
          setIsLoading(false);
        }, 100); // 给浏览器一点时间渲染 DOM（和 HTML 版本用 500ms，我们用 100ms 更快）
      })
      .catch(err => {
        console.error('❌ 加载失败:', err);
        setError(`加载失败: ${err.message}`);
        setIsLoading(false);
      });
  }, [mapSvgUrl]); // 只依赖 mapSvgUrl，避免重复加载！

  // 单独的 useEffect 用于更新 path 圆点颜色（当 routePOIs 或 completedPOIs 变化时）
  useEffect(() => {
    if (isLoading) return; // 等加载完成
    
    console.log('🎨 更新 path 圆点颜色，路线POI:', routePOIs, '已完成:', Array.from(completedPOIs));
    
    // 只更新 path 圆点的颜色
    const pathIds = Object.keys(PATH_TO_POI_MAP);
    pathIds.forEach(pathId => {
      const pathElement = document.getElementById(pathId);
      if (pathElement) {
        const poiNumber = parseInt(PATH_TO_POI_MAP[pathId]);
        const isInRoute = routePOIs.includes(poiNumber);
        const isCompleted = completedPOIs.has(poiNumber);
        
        // 更新颜色
        if (isCompleted) {
          pathElement.style.fill = '#10b981'; // 绿色 - 已完成
          pathElement.style.fillOpacity = '1';
        } else if (isInRoute) {
          pathElement.style.fill = '#60a5fa'; // 蓝色 - 当前路线
          pathElement.style.fillOpacity = '0.9';
        } else {
          pathElement.style.fill = '#9ca3af'; // 灰色 - 其他景点
          pathElement.style.fillOpacity = '0.6';
        }
        
        console.log(`🎨 #${pathId} → POI ${poiNumber}, 路线内:${isInRoute}, 已完成:${isCompleted}, 颜色:${pathElement.style.fill}`);
      }
    });
  }, [routePOIs, completedPOIs, isLoading]); // 只更新颜色，不重新加载 SVG

  // 拖动处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={className}>
      <Card className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50 shadow-2xl border-2 border-emerald-200">
        {/* 加载提示 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center h-[600px] bg-white z-50">
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 mx-auto text-emerald-500 animate-spin" />
              <div>
                <p className="text-emerald-800 font-bold text-lg">🗺️ 加载地图中...</p>
                <p className="text-sm text-emerald-600 mt-2">正在解析 SVG 文件</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center h-[600px] bg-white z-50">
            <div className="text-center">
              <p className="text-red-600 font-medium mb-2">❌ {error}</p>
              <Button onClick={() => window.location.reload()}>刷新页面</Button>
            </div>
          </div>
        )}
        
        {/* 地图内容（始终渲染，只是可能被覆盖） */}
        {(
          <>
            {/* 缩放控制 */}
            <div className="absolute top-6 left-6 z-30 flex flex-col gap-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-3 border-2 border-emerald-200">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                className="w-12 h-12 p-0 hover:bg-emerald-50 border-emerald-200 text-emerald-700"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="w-12 h-12 p-0 hover:bg-emerald-50 border-emerald-200 text-emerald-700"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom(1)}
                className="w-12 h-12 p-0 hover:bg-emerald-50 border-emerald-200 text-emerald-700"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
              <div className="text-sm text-center text-emerald-700 font-bold mt-1 px-1 py-1 bg-emerald-50 rounded">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* 地图容器 */}
            <div 
              className="relative w-full bg-white/50 backdrop-blur-sm overflow-hidden rounded-lg"
              style={{ height: '85vh', minHeight: '700px', cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={svgContainerRef}
                className="w-full h-full flex items-center justify-center p-6"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                }}
              />
            </div>
            
            {/* 图例和操作提示 - 响应式布局 */}
            {/* 移动端：垂直堆叠在左下角 */}
            {/* 桌面端：分别在左下角和右下角 */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex flex-col gap-3 z-20 max-w-[calc(100vw-2rem)] sm:max-w-xs">
              {/* 图例 */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-5 border-2 border-emerald-200">
                <h4 className="font-bold text-sm sm:text-base mb-2 sm:mb-3 text-emerald-900">📍 图例</h4>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-400 shadow-md flex-shrink-0"></div>
                    <span className="text-emerald-700 font-medium">当前路线待打卡</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 shadow-md flex-shrink-0"></div>
                    <span className="text-emerald-700 font-medium">当前路线已打卡</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-300 shadow-md flex-shrink-0"></div>
                    <span className="text-emerald-700 font-medium">其他景点</span>
                  </div>
                </div>
              </div>

              {/* 操作提示 - 在移动端显示在图例下方 */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 sm:p-5 border-2 border-emerald-200 sm:hidden">
                <div className="space-y-1.5 text-xs text-emerald-700">
                  <p className="font-bold text-sm text-emerald-900 mb-2">💡 操作提示</p>
                  <p>• 点击景点文字查看详情</p>
                  <p>• 使用左侧按钮缩放地图</p>
                  <p>• 拖动地图查看更多区域</p>
                </div>
              </div>
            </div>

            {/* 操作提示 - 桌面端在右下角 */}
            <div className="hidden sm:block absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-5 border-2 border-emerald-200 z-20 max-w-xs">
              <div className="space-y-2 text-sm text-emerald-700">
                <p className="font-bold text-base text-emerald-900 mb-3">💡 操作提示</p>
                <p>• 点击景点文字查看详情</p>
                <p>• 使用左侧按钮缩放地图</p>
                <p>• 拖动地图查看更多区域</p>
              </div>
            </div>

            {/* 悬停提示 */}
            {hoveredRef && (
              <div className="absolute top-6 right-6 z-40 animate-in fade-in duration-200">
                <Card className="p-5 shadow-2xl bg-white/95 backdrop-blur-sm border-2 border-emerald-300">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white px-3 py-1 text-base">
                        景点 {ID_TO_POI_MAP[hoveredRef]}
                      </Badge>
                      {routePOIs.includes(parseInt(ID_TO_POI_MAP[hoveredRef])) && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600 border-2">
                          当前路线
                        </Badge>
                      )}
                      {completedPOIs.has(parseInt(ID_TO_POI_MAP[hoveredRef])) && (
                        <Badge className="bg-emerald-600 text-white">
                          已完成
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-emerald-700 font-semibold">👆 点击查看详情</p>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
