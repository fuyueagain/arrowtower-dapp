
'use client';

import { useState, useEffect } from 'react';

// 类型定义
interface POI {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
  taskType: string;
  taskContent: string | null;
  order: number;
}

interface Route {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  difficulty: string;
  estimatedTime: number;
  poiCount: number;
  isActive: boolean;
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

export default function CheckinPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedPoi, setSelectedPoi] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [taskData, setTaskData] = useState({
    type: 'quiz',
    answer: '',
    photoUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [checkinResult, setCheckinResult] = useState<CheckinResponse | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
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
          showNotification('success', '位置获取成功');
        },
        (error) => {
          console.warn('获取位置失败:', error);
          showNotification('warning', '位置获取失败，使用默认位置');
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

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      showNotification('error', '请安装 MetaMask 钱包');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setWalletAddress(accounts[0]);
      setIsWalletConnected(true);
      showNotification('success', '钱包连接成功');
    } catch (error) {
      console.error('连接钱包失败:', error);
      showNotification('error', '钱包连接失败');
    }
  };

  // 加载路线数据
  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoadingRoutes(true);
      try {
        const response = await fetch('/api/route_list?page=1&limit=20&isActive=true');
        const result = await response.json();
        
        if (result.success && result.data?.routes) {
          setRoutes(result.data.routes);
        } else {
          showNotification('error', '获取路线失败');
        }
      } catch (error) {
        console.error('获取路线失败:', error);
        showNotification('error', '网络错误，无法获取路线');
      } finally {
        setIsLoadingRoutes(false);
      }
    };
    fetchRoutes();
  }, []);

  // 当选择路线时加载对应的打卡点
  useEffect(() => {
    if (selectedRoute) {
      const fetchPOIs = async () => {
        setIsLoadingPOIs(true);
        try {
          const response = await fetch(`/api/pois?routeId=${selectedRoute}`);
          const result = await response.json();
          
          if (result.success && result.data) {
            setPois(result.data);
            if (result.data.length === 0) {
              showNotification('warning', '该路线暂无打卡点');
            }
          } else {
            showNotification('error', result.message || '获取打卡点失败');
            setPois([]);
          }
        } catch (error) {
          console.error('获取打卡点失败:', error);
          showNotification('error', '网络错误，无法获取打卡点');
          setPois([]);
        } finally {
          setIsLoadingPOIs(false);
        }
      };
      fetchPOIs();
    } else {
      setPois([]);
      setSelectedPoi('');
    }
  }, [selectedRoute]);

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

  // 验证表单
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedRoute) newErrors.routeId = '请选择路线';
    if (!selectedPoi) newErrors.poiId = '请选择打卡点';
    if (!walletAddress.trim()) newErrors.walletAddress = '请连接钱包';
    if (!isWalletConnected) newErrors.wallet = '请先连接钱包';
    
    const selectedPoiData = pois.find(poi => poi.id === selectedPoi);
    if (selectedPoiData?.taskType === 'quiz' && !taskData.answer.trim()) {
      newErrors.answer = '请选择答案';
    }
    if (selectedPoiData?.taskType === 'photo' && !taskData.photoUrl.trim()) {
      newErrors.photo = '请上传照片';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理打卡点选择变化
  const handlePoiChange = async (poiId: string) => {
    setSelectedPoi(poiId);
    const selectedPoiData = pois.find(poi => poi.id === poiId);
    setTaskData({
      type: selectedPoiData?.taskType || 'quiz',
      answer: '',
      photoUrl: ''
    });
    
    if (poiId && isWalletConnected) {
      try {
        const newMessage = generateSignatureMessage(poiId);
        setMessage(newMessage);
        const newSignature = await signMessage(newMessage);
        setSignature(newSignature);
        showNotification('success', '签名成功');
      } catch (error: any) {
        showNotification('error', error.message || '签名失败');
        setMessage('');
        setSignature('');
      }
    } else {
      setMessage('');
      setSignature('');
    }
  };

  // 处理任务数据变化
  const handleTaskDataChange = (field: string, value: string) => {
    setTaskData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 模拟照片上传
  const handlePhotoUpload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setTaskData(prev => ({
        ...prev,
        photoUrl: `/uploads/checkin_${Date.now()}_photo.jpg`
      }));
      setIsLoading(false);
      showNotification('success', '照片上传成功');
    }, 1000);
  };

  // 获取设备信息
  const getDeviceInfo = () => {
    return {
      fingerprint: `device_fp_${Math.random().toString(36).substring(2)}`,
      userAgent: navigator.userAgent
    };
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('error', '请完善表单信息');
      return;
    }

    setIsLoading(true);
    setCheckinResult(null);

    try {
      const submitData = {
        routeId: selectedRoute,
        poiId: selectedPoi,
        walletAddress,
        signature,
        message,
        location: userLocation,
        taskData,
        deviceInfo: getDeviceInfo()
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
        // 重置表单
        setSelectedRoute('');
        setSelectedPoi('');
        setMessage('');
        setSignature('');
        setTaskData({ type: 'quiz', answer: '', photoUrl: '' });
        setErrors({});
      } else {
        showNotification('error', result.message || '打卡失败，请重试');
      }
    } catch (error) {
      console.error('打卡失败:', error);
      showNotification('error', '网络错误，打卡失败');
      setCheckinResult({
        success: false,
        message: '网络错误',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前选中的POI数据
  const selectedPoiData = pois.find(poi => poi.id === selectedPoi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 通知栏 */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          } text-white max-w-md`}>
            {notification.message}
          </div>
        )}

        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">景点打卡</h1>
          <p className="text-gray-600">探索路线，完成打卡，收集专属 NFT</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：打卡表单 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-6">
                {/* 钱包连接 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    钱包连接
                  </label>
                  {isWalletConnected ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-700">
                        已连接: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </span>
                      <span className="text-green-600">✓</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={connectWallet}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      连接 MetaMask 钱包
                    </button>
                  )}
                  {errors.wallet && (
                    <p className="mt-1 text-sm text-red-600">{errors.wallet}</p>
                  )}
                </div>

                {/* 路线选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择路线
                  </label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => {
                      setSelectedRoute(e.target.value);
                      setSelectedPoi('');
                      setMessage('');
                      setSignature('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isLoadingRoutes || !isWalletConnected}
                  >
                    <option value="">
                      {isLoadingRoutes ? '加载中...' : '请选择路线'}
                    </option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.poiCount}个打卡点) - {route.difficulty}
                      </option>
                    ))}
                  </select>
                  {errors.routeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.routeId}</p>
                  )}
                </div>

                {/* 打卡点选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择打卡点
                  </label>
                  <select
                    value={selectedPoi}
                    onChange={(e) => handlePoiChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedRoute || isLoadingPOIs}
                  >
                    <option value="">
                      {isLoadingPOIs ? '加载中...' : '请选择打卡点'}
                    </option>
                    {pois.map((poi) => (
                      <option key={poi.id} value={poi.id}>
                        {poi.name} (第{poi.order}站) - {poi.taskType}
                      </option>
                    ))}
                  </select>
                  {errors.poiId && (
                    <p className="mt-1 text-sm text-red-600">{errors.poiId}</p>
                  )}
                </div>

                {/* 任务数据 */}
                {selectedPoiData && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-3">打卡任务</h3>
                    <p className="text-sm text-blue-700 mb-3">{selectedPoiData.description}</p>
                    
                    {selectedPoiData.taskType === 'quiz' && (
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          {selectedPoiData.taskContent || '回答问题'}
                        </label>
                        <div className="space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => (
                            <label key={option} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="quizAnswer"
                                value={option}
                                checked={taskData.answer === option}
                                onChange={(e) => handleTaskDataChange('answer', e.target.value)}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-blue-700">选项 {option}</span>
                            </label>
                          ))}
                        </div>
                        {errors.answer && (
                          <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
                        )}
                      </div>
                    )}

                    {selectedPoiData.taskType === 'photo' && (
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          拍摄照片任务
                        </label>
                        <div className="space-y-3">
                          {taskData.photoUrl ? (
                            <div className="text-green-600 text-sm">
                              ✅ 照片已上传: {taskData.photoUrl}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handlePhotoUpload}
                              disabled={isLoading}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                            >
                              {isLoading ? '上传中...' : '模拟上传照片'}
                            </button>
                          )}
                          {errors.photo && (
                            <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 位置信息 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">位置信息</h3>
                  {userLocation ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>纬度: {userLocation.latitude.toFixed(6)}</p>
                      <p>经度: {userLocation.longitude.toFixed(6)}</p>
                      <p>精度: ±{userLocation.accuracy.toFixed(1)}米</p>
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-600">正在获取位置信息...</p>
                  )}
                </div>

                {/* 签名信息 */}
                {signature && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">签名信息</h3>
                    <p className="text-xs text-gray-500 break-all">{signature}</p>
                  </div>
                )}

                {/* 提交按钮 */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !selectedRoute || !isWalletConnected}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '打卡中...' : '立即打卡'}
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：打卡结果 */}
          <div className="space-y-6">
            {checkinResult && (
              <div className={`bg-white rounded-2xl shadow-lg p-6 ${
                checkinResult.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
              }`}>
                <h3 className="text-lg font-semibold mb-4">
                  {checkinResult.success ? '✅ 打卡成功' : '❌ 打卡失败'}
                </h3>
                
                {checkinResult.success && checkinResult.data && (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        打卡点: {checkinResult.data.poi.name}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">路线进度</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700">
                          已完成 {checkinResult.data.routeProgress.completed} / {checkinResult.data.routeProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(checkinResult.data.routeProgress.completed / checkinResult.data.routeProgress.total) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {checkinResult.data.routeProgress.nextPOI && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-1">下一个打卡点</h4>
                        <p className="text-sm text-yellow-700">
                          {checkinResult.data.routeProgress.nextPOI.name}
                        </p>
                      </div>
                    )}

                    {checkinResult.data.nftStatus.willMint && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-1">🎉 恭喜！</h4>
                        <p className="text-sm text-purple-700">
                          已完成路线，即将发放 NFT 奖励
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!checkinResult.success && (
                  <p className="text-red-600">{checkinResult.message || '打卡失败，请重试'}</p>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">打卡说明</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 先连接 MetaMask 钱包</li>
                <li>• 选择要打卡的路线和地点</li>
                <li>• 选择打卡点时自动签名</li>
                <li>• 确保已开启定位权限</li>
                <li>• 完成打卡任务（答题/拍照）</li>
                <li>• 每个打卡点只能打卡一次</li>
                <li>• 完成整条路线可获得 NFT</li>
              </ul>
            </div>

            {/* 数据预览 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">状态信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">钱包状态:</span>
                  <span className={isWalletConnected ? 'text-green-600' : 'text-gray-400'}>
                    {isWalletConnected ? '已连接' : '未连接'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">路线选择:</span>
                  <span className={selectedRoute ? 'text-blue-600' : 'text-gray-400'}>
                    {selectedRoute ? '已选择' : '未选择'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">打卡点:</span>
                  <span className={selectedPoi ? 'text-blue-600' : 'text-gray-400'}>
                    {selectedPoi ? '已选择' : '未选择'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">签名状态:</span>
                  <span className={signature ? 'text-green-600' : 'text-gray-400'}>
                    {signature ? '已签名' : '未签名'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}