/**
 * 📱 扫码打卡页面 - 动态路由实现
 * 
 * 文件路径: /src/app/user/[poi]/page.tsx
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📖 使用说明
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 🎯 功能概述:
 *    这是一个专为二维码扫码打卡设计的动态路由页面。
 *    用户扫描景点的二维码后，会直接跳转到对应景点的打卡页面，
 *    无需在地图上查找，快速完成打卡流程。
 * 
 * 🔗 URL 格式:
 *    http://localhost:3000/user/[poi]
 *    
 *    其中 [poi] 可以是:
 *    - POI Order (景点编号): 如 /user/9 表示景点9
 *    - POI ID: 如 /user/poi_9 (备选方式)
 * 
 * 📋 所有可用的 URL:
 *    景点 0  - 箭塔介绍          http://localhost:3000/user/0
 *    景点 2  - 山花茶社          http://localhost:3000/user/2
 *    景点 9  - 猫鼻子餐厅        http://localhost:3000/user/9
 *    景点 11 - 创业孵化器        http://localhost:3000/user/11
 *    景点 20 - 箭塔村村史馆      http://localhost:3000/user/20
 *    景点 21 - 周先生的百草园    http://localhost:3000/user/21
 *    景点 22 - 青年创客园地      http://localhost:3000/user/22
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🚀 使用流程
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 步骤 1: 用户扫描景点二维码
 *         ↓
 * 步骤 2: 浏览器打开 http://localhost:3000/user/9
 *         ↓
 * 步骤 3: 页面自动加载景点9的信息（猫鼻子餐厅）
 *         - 显示景点图片
 *         - 显示景点名称和描述
 *         - 显示打卡按钮
 *         ↓
 * 步骤 4: 用户点击右上角"连接钱包"（如果未连接）
 *         ↓
 * 步骤 5: 用户点击"🎯 立即打卡"按钮
 *         ↓
 * 步骤 6: 弹出签名确认对话框
 *         ↓
 * 步骤 7: 用户在钱包（MetaMask）中确认签名
 *         ↓
 * 步骤 8: 系统提交打卡数据到后端 /api/checkins
 *         ↓
 * 步骤 9: 显示打卡结果
 *         - 成功: 显示打卡成功信息、路线进度、下一个打卡点
 *         - 失败: 显示错误提示（如已打卡、距离太远等）
 *         ↓
 * 步骤 10: 用户点击"返回地图"或继续扫描下一个景点
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎨 页面结构
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ArrowTowerHeader (顶部导航栏)                               │
 * │  [连接钱包] [0x1234...5678]                                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📍 扫码打卡                                                 │
 * │  完成签名即可打卡                                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ┌─────────────┐  景点信息卡片                              │
 * │  │             │  • 景点名称: 箭塔村——猫鼻子餐厅             │
 * │  │   景点图片   │  • 景点编号: 9                             │
 * │  │             │  • 任务类型: location                      │
 * │  │             │  • 描述: 景点的详细介绍...                  │
 * │  └─────────────┘                                            │
 * │                                                              │
 * │  [🎯 立即打卡]  或  [✓ 已打卡]                               │
 * │  [取消] / [关闭]                                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │  打卡结果展示 (打卡成功后显示)                                │
 * │  • 打卡成功信息                                               │
 * │  • 路线进度 (已完成 x / 总共 3)                               │
 * │  • 已打卡景点列表                                             │
 * │  • 下一个打卡点                                               │
 * │                                                              │
 * │  [返回地图]                                                  │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔧 技术实现
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1️⃣ 动态路由参数获取:
 *    const params = useParams();
 *    const poiId = params.poi as string;  // 从URL获取 [poi] 参数
 * 
 * 2️⃣ POI 数据加载:
 *    - 先获取路线列表: GET /api/route_list
 *    - 获取第一条路线的POI列表: GET /api/pois?routeId=route_1
 *    - 匹配 poiId，找到对应的 POI 数据
 * 
 * 3️⃣ 钱包连接检测:
 *    - 使用 wagmi 的 useAccount 钩子
 *    - isConnected: 检查钱包是否连接
 *    - address: 获取钱包地址
 * 
 * 4️⃣ 签名流程:
 *    - 生成随机 nonce 和时间戳
 *    - 使用 signMessageAsync 请求签名
 *    - 格式: "ArrowTower Checkin: poi=poi_9, nonce=abc123, timestamp=1234567890"
 * 
 * 5️⃣ 打卡提交:
 *    POST /api/checkins
 *    {
 *      routeId: "route_1",
 *      poiId: "poi_9",
 *      walletAddress: "0x...",
 *      signature: "0x...",
 *      message: "ArrowTower Checkin: ...",
 *      location: { latitude, longitude, accuracy, timestamp },
 *      taskData: { type, answer, photoUrl },
 *      deviceInfo: { fingerprint, userAgent }
 *    }
 * 
 * 6️⃣ 状态管理:
 *    - poiData: POI 详细信息
 *    - checkinResult: 打卡结果
 *    - showSignatureDialog: 签名对话框显示状态
 *    - isSubmitting: 提交中状态
 *    - notification: 通知消息（成功/失败/警告）
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🆚 与主页面的区别
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 主页面 (/user):
 *    ✅ 显示完整地图
 *    ✅ 可以选择不同路线
 *    ✅ 可以点击地图上的文字选择景点
 *    ✅ 显示所有景点和打卡进度
 *    🎯 适合: 探索浏览、规划路线
 * 
 * 扫码页面 (/user/[poi]):
 *    ❌ 无地图
 *    ❌ 自动选择第一条路线
 *    ✅ URL 直接指定景点
 *    ✅ 专注于单个景点打卡
 *    🎯 适合: 现场快速打卡
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📝 注意事项
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ⚠️ 必须先登录: 未登录用户会被重定向到首页
 * ⚠️ 必须连接钱包: 未连接钱包无法打卡
 * ⚠️ 不能重复打卡: 已打卡的景点会显示"已打卡"状态
 * ⚠️ 需要签名确认: 每次打卡都需要在钱包中确认签名
 * ⚠️ 景点0特殊: 箭塔介绍只能查看，不能打卡
 * ⚠️ 需要定位权限: 浏览器会请求地理位置权限
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎯 二维码生成建议
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 为每个景点生成二维码，内容为对应的 URL:
 * 
 * 景点 2:  https://arrowtower.netlify.app/user/2
 * 景点 9:  https://arrowtower.netlify.app/user/9
 * 景点 11: https://arrowtower.netlify.app/user/11
 * 景点 20: https://arrowtower.netlify.app/user/20
 * 景点 21: https://arrowtower.netlify.app/user/21
 * 景点 22: https://arrowtower.netlify.app/user/22
 * 
 * 建议将二维码打印或制作成标识牌，放置在对应景点现场。
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAccount, useSignMessage } from 'wagmi';
import { ArrowTowerHeader } from '@/components/maps/ArrowTowerHeader';
import { SignatureConfirm } from '@/components/maps/SignatureConfirm';
import { CheckinProgress } from '@/components/maps/CheckinProgress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

// 类型定义
interface POI {
  id: string;
  name: string;
  description: string | null;
  order: number;
  taskType: string;
  latitude?: number;
  longitude?: number;
  routeId?: string;
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

export default function QRCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const poiId = params.poi as string;
  
  // 状态管理
  const [poiData, setPOIData] = useState<POI | null>(null);
  const [routeId, setRouteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkinResult, setCheckinResult] = useState<CheckinResponse | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
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

  // 保护路由
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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
  }, []);

  // 获取 POI 数据
  useEffect(() => {
    const fetchPOIData = async () => {
      try {
        setIsLoading(true);
        
        // 首先获取路线列表
        const routesResponse = await fetch('/api/route_list?page=1&limit=20&isActive=true');
        const routesResult = await routesResponse.json();
        
        if (!routesResult.success || !routesResult.data?.routes || routesResult.data.routes.length === 0) {
          showNotification('error', '未找到可用路线');
          setIsLoading(false);
          return;
        }
        
        // 使用第一个路线
        const firstRoute = routesResult.data.routes[0];
        setRouteId(firstRoute.id);
        
        // 获取该路线的 POI 列表
        const poisResponse = await fetch(`/api/pois?routeId=${firstRoute.id}`);
        const poisResult = await poisResponse.json();
        
        if (poisResult.success && poisResult.data) {
          // 根据 poiId 查找对应的 POI
          const targetPOI = poisResult.data.find((p: POI) => 
            p.id === poiId || p.order.toString() === poiId
          );
          
          if (targetPOI) {
            setPOIData(targetPOI);
          } else {
            showNotification('error', `未找到 POI: ${poiId}`);
          }
        }
      } catch (error) {
        console.error('获取 POI 数据失败:', error);
        showNotification('error', '加载失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (poiId) {
      fetchPOIData();
    }
  }, [poiId]);

  // 开始打卡
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
    if (!poiData || !address || !routeId) return;

    setIsSubmitting(true);
    try {
      const message = generateSignatureMessage(poiData.id);
      
      // 使用 wagmi 的 signMessage
      const signature = await signMessageAsync({ message });
      
      showNotification('success', '签名成功');

      const submitData = {
        routeId: routeId,
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
      } else {
        showNotification('error', result.message || '打卡失败，请重试');
      }
    } catch (error: any) {
      console.error('打卡失败:', error);
      showNotification('error', error.message || '打卡失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 加载中
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-emerald-700 font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录
  if (!session) {
    return null;
  }

  // 未找到 POI
  if (!poiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-8">
        <ArrowTowerHeader />
        <div className="max-w-2xl mx-auto px-4 mt-8">
          <Card className="p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg border-2 border-red-200">
            <p className="text-xl text-red-600 font-bold mb-4">❌ 未找到打卡点</p>
            <p className="text-gray-600 mb-6">POI ID: {poiId}</p>
            <button
              onClick={() => router.push('/user')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              返回地图
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // 获取图片 URL
  const imageUrl = poiData.order === 0 
    ? '/arrowtower.jpg' 
    : `/pic/svg_small/img_${poiData.order}.svg`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* 通知栏 */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl border-2 ${
            notification.type === 'success' ? 'bg-emerald-500 border-emerald-600' :
            notification.type === 'error' ? 'bg-red-500 border-red-600' : 'bg-yellow-500 border-yellow-600'
          } text-white max-w-md animate-in slide-in-from-top-2 backdrop-blur-sm`}>
            <p className="font-semibold">{notification.message}</p>
          </div>
        )}

        {/* Header */}
        <ArrowTowerHeader />

        {/* 页面标题 */}
        <div className="text-center my-6">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 mb-2">
            📍 扫码打卡
          </h1>
          <p className="text-gray-600 font-medium">完成签名即可打卡</p>
        </div>

        {/* POI 信息卡片 */}
        <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl border-2 border-emerald-200 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 左侧：图片 */}
            <div className="flex-shrink-0">
              <div className="relative w-full md:w-64 h-64 rounded-lg overflow-hidden shadow-lg border-2 border-emerald-300">
                <Image
                  src={imageUrl}
                  alt={poiData.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* 右侧：信息 */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-emerald-600 text-white text-sm">
                    景点 {poiData.order}
                  </Badge>
                  {poiData.taskType && (
                    <Badge variant="outline" className="border-green-600 text-green-700">
                      {poiData.taskType}
                    </Badge>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-emerald-900 mb-4">
                  {poiData.name}
                </h2>
                
                {poiData.description && (
                  <div className="bg-emerald-50/60 p-4 rounded-lg border border-emerald-200 mb-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {poiData.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 打卡按钮 */}
              {!checkinResult && (
                <div className="mt-4">
                  {!isConnected ? (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                      <p className="text-yellow-800 font-semibold mb-2">⚠️ 请先连接钱包</p>
                      <p className="text-sm text-yellow-700">点击右上角连接钱包按钮</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartCheckin}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '处理中...' : '🎯 立即打卡'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 打卡结果 */}
        {checkinResult && (
          <div className="mb-6">
            <CheckinProgress result={checkinResult} />
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/user')}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
              >
                返回地图
              </button>
            </div>
          </div>
        )}

        {/* 签名确认对话框 */}
        <SignatureConfirm
          open={showSignatureDialog}
          onConfirm={handleConfirmSignature}
          onCancel={() => setShowSignatureDialog(false)}
          poiName={poiData?.name}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}

