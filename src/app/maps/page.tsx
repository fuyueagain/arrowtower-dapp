'use client';

import { useState, useEffect } from 'react';
import { MapViewer, POIInfo } from '@/components/maps/MapViewer';
import { POIDetailModal, POI } from '@/components/maps/POIDetailModal';
import { WalletConnector } from '@/components/maps/WalletConnector';
import { SignatureConfirm } from '@/components/maps/SignatureConfirm';
import { CheckinProgress } from '@/components/maps/CheckinProgress';
import { Card } from '@/components/ui/card';

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

// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function MapsPage() {
  // 状态管理
  const [selectedPOI, setSelectedPOI] = useState<POIInfo | null>(null);
  const [poiData, setPOIData] = useState<POI | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
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
          // 使用默认位置
          setUserLocation({
            latitude: 30.123567,
            longitude: 103.456890,
            accuracy: 12.5,
            timestamp: new Date().toISOString()
          });
        }
      );
    }
  }, []);

  // 加载路线数据
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/route_list?page=1&limit=20&isActive=true');
        const result = await response.json();
        
        if (result.success && result.data?.routes) {
          setRoutes(result.data.routes);
          // 自动选择第一条路线
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

  // 加载 POI 数据
  useEffect(() => {
    if (selectedRoute) {
      const fetchPOIs = async () => {
        try {
          const response = await fetch(`/api/pois?routeId=${selectedRoute}`);
          const result = await response.json();
          
          if (result.success && result.data) {
            setPois(result.data);
          }
        } catch (error) {
          console.error('获取打卡点失败:', error);
        }
      };
      fetchPOIs();
    }
  }, [selectedRoute]);

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      showNotification('error', '请安装 MetaMask 钱包');
      return;
    }

    try {
      setIsLoading(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setWalletAddress(accounts[0]);
      setIsWalletConnected(true);
      showNotification('success', '钱包连接成功');
    } catch (error) {
      console.error('连接钱包失败:', error);
      showNotification('error', '钱包连接失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理地图点击
  const handlePOIClick = (poiInfo: POIInfo) => {
    setSelectedPOI(poiInfo);
    
    // 根据 POI 编号查找对应的 POI 数据
    // 假设 POI 的 order 字段对应编号
    const matchedPOI = pois.find(poi => poi.order === parseInt(poiInfo.poiNumber));
    setPOIData(matchedPOI || null);
  };

  // 开始打卡流程
  const handleStartCheckin = () => {
    if (!isWalletConnected) {
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

  // 使用 MetaMask 签名
  const signMessage = async (messageToSign: string) => {
    if (!isWalletConnected || !walletAddress) {
      throw new Error('请先连接钱包');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageToSign, walletAddress],
      });
      return signature;
    } catch (error) {
      console.error('签名失败:', error);
      throw new Error('用户拒绝签名或签名失败');
    }
  };

  // 确认签名并提交打卡
  const handleConfirmSignature = async () => {
    if (!poiData) return;

    setIsLoading(true);
    try {
      // 生成签名消息
      const message = generateSignatureMessage(poiData.id);
      
      // 请求签名
      const signature = await signMessage(message);
      
      showNotification('success', '签名成功');

      // 提交打卡
      const submitData = {
        routeId: selectedRoute,
        poiId: poiData.id,
        walletAddress,
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

      console.log('提交打卡数据:', JSON.stringify(submitData, null, 2));

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
        
        // 添加到已完成列表
        if (poiData) {
          setCompletedPOIs(prev => new Set([...prev, poiData.order]));
        }
      } else {
        showNotification('error', result.message || '打卡失败，请重试');
      }
    } catch (error: any) {
      console.error('打卡失败:', error);
      showNotification('error', error.message || '打卡失败');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* 头部 - 紧凑 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 mb-1">
             箭塔村探索地图
          </h1>
          <p className="text-gray-600 font-medium">点击地图景点查看详情并打卡</p>
        </div>

        {/* 地图居中显示 - 限制宽度 */}
        <div className="mb-6 max-w-6xl mx-auto">
          <MapViewer
            mapSvgUrl="/map.svg"
            onPOIClick={handlePOIClick}
            routePOIs={pois.map(poi => poi.order)}
            completedPOIs={completedPOIs}
          />
        </div>

        {/* 底部：控制面板 - 水平排列，宽度与地图一致 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          {/* 钱包连接 */}
          <WalletConnector
            isConnected={isWalletConnected}
            walletAddress={walletAddress}
            onConnect={connectWallet}
            isLoading={isLoading}
          />

          {/* 路线信息 */}
          {selectedRoute && routes.length > 0 && (
            <Card className="p-5 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
              <h3 className="font-bold mb-3 text-emerald-900">当前路线</h3>
              {routes.find(r => r.id === selectedRoute) && (
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-emerald-700">
                    {routes.find(r => r.id === selectedRoute)?.name}
                  </p>
                  <p className="text-gray-700">
                    {routes.find(r => r.id === selectedRoute)?.description}
                  </p>
                  <p className="text-gray-600 font-medium">
                    共 {routes.find(r => r.id === selectedRoute)?.poiCount} 个打卡点
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* 打卡结果 - 与地图宽度一致 */}
        {checkinResult && (
          <div className="mt-4 max-w-6xl mx-auto">
            <CheckinProgress result={checkinResult} />
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
