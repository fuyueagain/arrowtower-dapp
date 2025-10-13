// /app/user/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';
import { MapViewer, POIInfo } from '@/components/maps/MapViewer';
import { POIDetailModal, POI } from '@/components/maps/POIDetailModal';
import { SignatureConfirm } from '@/components/maps/SignatureConfirm';
import { CheckinProgress } from '@/components/maps/CheckinProgress';
import { ArrowTowerHeader } from '@/components/maps/ArrowTowerHeader';
import { RouteSelector } from '@/components/maps/RouteSelector';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 类型定义
interface Route {
  id: string;
  name: string;
  description: string | null;
  poiCount: number;
}

interface CheckinResponse {
  success: boolean;
  data?: {
    checkinId: string;
    status: string;
    poi: {
      id: string;
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
    timestamp: string;
  };
  message?: string;
  timestamp: string;
}

export default function UserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // 状态管理
  const [selectedPOI, setSelectedPOI] = useState<POIInfo | null>(null);
  const [poiData, setPOIData] = useState<POI | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<CheckinResponse | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [completedPOIs, setCompletedPOIs] = useState<Set<number>>(new Set());

  // 路线和 POI 数据
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  // 用户位置
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);

  // 保护路由
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // 显示通知
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 获取用户位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('获取位置失败:', error);
          setUserLocation({
            latitude: 30.123567,
            longitude: 103.456890,
            accuracy: 12.5,
            timestamp: new Date().toISOString()
          });
        }
      );
    }
  }, []); // 只在组件挂载时执行一次, []);

  // 加载路线数据
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/route_list?page=1&limit=20&isActive=true');
        const result = await response.json();
        
        if (result.success && result.data?.routes) {
          setRoutes(result.data.routes);
          if (result.data.routes.length > 0) {
            setSelectedRoute(result.data.routes[0].id);
          }
        }
      } catch (error) {
        console.error('获取路线失败:', error);
        showNotification('error', '网络错误，无法获取路线');
      }
    };
    fetchRoutes();
  }, []);

  // 加载 POI 数据和打卡记录
  useEffect(() => {
    if (selectedRoute && address) {
      const fetchPOIsAndCheckins = async () => {
        try {
          // 获取 POI 列表
          const poisResponse = await fetch(`/api/pois?routeId=${selectedRoute}`);
          const poisResult = await poisResponse.json();
          
          if (poisResult.success && poisResult.data) {
            // 过滤掉景点0（箭塔介绍），它不是打卡点
            const filteredPOIs = poisResult.data.filter((poi: POI) => poi.order !== 0);
            setPois(filteredPOIs);
          }

          // 获取该路线的打卡记录
          const checkinsResponse = await fetch(`/api/checkins?routeId=${selectedRoute}&status=approved`);
          const checkinsResult = await checkinsResponse.json();
          
          if (checkinsResult.success && checkinsResult.data?.checkins) {
            // 过滤出当前用户的打卡记录，并提取 POI order
            const userCheckins = checkinsResult.data.checkins.filter(
              (checkin: any) => 
                checkin.user?.walletAddress?.toLowerCase() === address?.toLowerCase() &&
                checkin.route?.id === selectedRoute
            );
            
            const completedOrders = new Set<number>(
              userCheckins.map((checkin: any) => checkin.poi.order as number)
            );
            
            console.log('📊 当前路线已完成的打卡:', Array.from(completedOrders), '用户:', address);
            setCompletedPOIs(completedOrders);
          } else {
            // 如果没有打卡记录，清空已完成列表
            setCompletedPOIs(new Set());
          }
        } catch (error) {
          console.error('获取数据失败:', error);
        }
      };
      fetchPOIsAndCheckins();
    }
  }, [selectedRoute, address]); // 依赖路线和钱包地址

  // 处理地图点击
  const handlePOIClick = (poiInfo: POIInfo) => {
    setSelectedPOI(poiInfo);
    const matchedPOI = pois.find(poi => poi.order === parseInt(poiInfo.poiNumber));
    setPOIData(matchedPOI || null);
  };

  // 开始打卡流程
  const handleStartCheckin = () => {
    if (!isConnected || !address) {
      showNotification('error', '请先连接钱包');
      return;
    }

    if (!poiData) {
      showNotification('error', '未找到打卡点数据');
      return;
    }

    setShowSignatureDialog(true);
  };

  // 生成签名消息
  const generateSignatureMessage = (poiId: string) => {
    const nonce = Math.random().toString(36).substring(7);
    return `ArrowTower Checkin: poi=${poiId}, nonce=${nonce}, timestamp=${Date.now()}`;
  };

  // 确认签名并提交打卡
  const handleConfirmSignature = async () => {
    if (!poiData || !address) return;

    setIsLoading(true);
    try {
      const message = generateSignatureMessage(poiData.id);
      
      // 使用 wagmi 的 signMessage
      const signature = await signMessageAsync({ message });
      
      showNotification('success', '签名成功');

      const submitData = {
        routeId: selectedRoute,
        poiId: poiData.id,
        walletAddress: address.toLowerCase().trim(),
        signature,
        message,
        location: userLocation,
        taskData: {
          type: poiData.taskType,
          answer: '',
          photoUrl: ''
        },
        deviceInfo: {
          fingerprint: `device_fp_${Math.random().toString(36).substring(2)}`,
          userAgent: navigator.userAgent
        }
      };

      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      setCheckinResult(result);

      if (result.success) {
        showNotification('success', '打卡成功！');
        setShowSignatureDialog(false);
        setSelectedPOI(null);
        setPOIData(null);
        
        // 更新已完成的POI列表
        if (poiData) {
          setCompletedPOIs(prev => new Set([...prev, poiData.order]));
        }
        
        // 注意：不再清除 checkinResult，让打卡进度一直显示
      } else {
        showNotification('error', result.message || '打卡失败，请重试');
        
        // 打卡失败后，2秒后清除失败结果，允许用户重试
        setTimeout(() => {
          setCheckinResult(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error('打卡失败:', error);
      showNotification('error', error.message || '打卡失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载中状态
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-emerald-700 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录重定向
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-4">
      <div className="max-w-[98vw] mx-auto px-2 sm:px-4">
        {/* 通知栏 */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl border-2 ${
            notification.type === 'success' ? 'bg-emerald-500 border-emerald-600' :
            notification.type === 'error' ? 'bg-red-500 border-red-600' : 'bg-yellow-500 border-yellow-600'
          } text-white max-w-md animate-in slide-in-from-top-2 backdrop-blur-sm`}>
            <p className="font-semibold">{notification.message}</p>
          </div>
        )}

        {/* Header 组件 - 使用新的 wagmi 版本 */}
        <ArrowTowerHeader />

        {/* 头部 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 mb-1">
            🗺️ 箭塔探索地图
          </h1>
          <p className="text-gray-600 font-medium">点击地图景点查看详情并打卡</p>
        </div>

        {/* 地图居中显示 */}
        <div className="mb-6 max-w-6xl mx-auto">
          <MapViewer
            mapSvgUrl="/map.svg"
            onPOIClick={handlePOIClick}
            routePOIs={pois.map(poi => poi.order)}
            completedPOIs={completedPOIs}
          />
        </div>

        {/* 底部：路线选择器 */}
        <div className="max-w-6xl mx-auto">
          {routes.length > 0 && (
            <RouteSelector
              routes={routes}
              selectedRoute={selectedRoute}
              onSelectRoute={setSelectedRoute}
              completedCount={completedPOIs.size}
            />
          )}
        </div>

        {/* 打卡进度 - 始终显示 */}
        {selectedRoute && pois.length > 0 && (
          <div className="mt-4 max-w-6xl mx-auto">
            <CheckinProgress 
              result={checkinResult}
              completedPOIs={pois.filter(poi => completedPOIs.has(poi.order)).map(poi => ({
                name: poi.name,
                order: poi.order
              }))}
              routeName={routes.find(r => r.id === selectedRoute)?.name}
              totalPOIs={pois.length}
            />
          </div>
        )}

        {/* POI 详情对话框 */}
        {selectedPOI && (
          <POIDetailModal
            open={!!selectedPOI}
            onClose={() => {
              setSelectedPOI(null);
              setPOIData(null);
            }}
            poiNumber={selectedPOI.poiNumber}
            imageUrl={selectedPOI.imageUrl}
            poiData={poiData}
            onCheckin={handleStartCheckin}
            isLoading={isLoading}
            isCompleted={completedPOIs.has(parseInt(selectedPOI.poiNumber))}
          />
        )}

        {/* 签名确认对话框 */}
        <SignatureConfirm
          open={showSignatureDialog}
          onConfirm={handleConfirmSignature}
          onCancel={() => setShowSignatureDialog(false)}
          poiName={poiData?.name}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}