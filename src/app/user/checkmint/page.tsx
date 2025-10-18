// /src/app/checkmint/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Download, ExternalLink, Trophy } from 'lucide-react';
import { ArrowTowerHeader } from '@/components/maps/ArrowTowerHeader';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  background_color?: string;
  attributes?: Array<{ trait_type: string; value: string | number }> | string;
  route?: { name: string };
}

interface MintResult {
  success: boolean;
  nftTokenId?: string;
  metadata?: NFTMetadata | string;
  message?: string;
  attempts?: number;
}

// 解析 NFT 数据的函数
const parseNFTData = (data: any): MintResult => {
  const result = { ...data };
  
  // 解析 metadata
  if (result.metadata) {
    if (typeof result.metadata === 'string') {
      try {
        result.metadata = JSON.parse(result.metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
        result.metadata = {};
      }
    }
    
    // 解析 attributes
    if (result.metadata && typeof result.metadata.attributes === 'string') {
      try {
        result.metadata.attributes = JSON.parse(result.metadata.attributes);
      } catch (e) {
        console.error('Failed to parse attributes:', e);
        result.metadata.attributes = [];
      }
    }
    
    // 确保 attributes 是数组
    if (result.metadata && !Array.isArray(result.metadata.attributes)) {
      result.metadata.attributes = [];
    }
  }
  
  return result;
};

export default function CheckMintPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isChecking, setIsChecking] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string; } | null>(null);

  // NFT 合约地址从环境变量获取
  const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS || '0x70E0e8F8024C3b3128aeaD68aC846bdDfeb1830c';
  
  // Blockscout 浏览器基础 URL
  const BLOCKSCOUT_BASE_URL = 'https://blockscout-passet-hub.parity-testnet.parity.io';

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

  // 开始检查 NFT 铸造状态
  const checkMintStatus = async () => {
    if (!address) {
      showNotification('error', '请先连接钱包');
      return;
    }

    setIsChecking(true);
    setError(null);
    setMintResult(null);

    try {
      // 将钱包地址转为小写再提交
      const lowercaseAddress = address.toLowerCase();
      const response = await fetch(`/api/checkmint?walletAddress=${lowercaseAddress}`);
      const result = await response.json();

      if (result.success) {
        // 解析返回的数据
        const parsedResult = parseNFTData(result);
        setMintResult(parsedResult);
        showNotification('success', 'NFT 铸造成功！🎉');
      } else {
        setError(result.message || '未找到 NFT 铸造记录');
        showNotification('warning', result.message || '暂未找到 NFT');
      }
    } catch (err) {
      console.error('检查 NFT 失败:', err);
      setError('网络错误，请重试');
      showNotification('error', '网络错误，请重试');
    } finally {
      setIsChecking(false);
    }
  };

  // 一键导入 NFT 到钱包
  const addNFTToWallet = async () => {
    if (!mintResult?.nftTokenId) return;

    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: NFT_CONTRACT_ADDRESS,
            tokenId: mintResult.nftTokenId,
          },
        },
      });

      if (wasAdded) {
        showNotification('success', 'NFT 已添加到钱包');
      }
    } catch (err) {
      console.error('添加 NFT 失败:', err);
      showNotification('error', '添加 NFT 失败');
    }
  };

  // 在区块链浏览器中查看 NFT
  const viewOnBlockscout = () => {
    if (!mintResult?.nftTokenId) return;
    const url = `${BLOCKSCOUT_BASE_URL}/token/${NFT_CONTRACT_ADDRESS}/instance/${mintResult.nftTokenId}`;
    window.open(url, '_blank');
  };

  // 获取解析后的 metadata（确保是对象）
  const getParsedMetadata = (): NFTMetadata => {
    if (!mintResult?.metadata) return {};
    
    if (typeof mintResult.metadata === 'string') {
      try {
        return JSON.parse(mintResult.metadata);
      } catch (e) {
        console.error('Error parsing metadata:', e);
        return {};
      }
    }
    
    return mintResult.metadata;
  };

  // 获取解析后的 attributes（确保是数组）
  const getParsedAttributes = (): Array<{ trait_type: string; value: string | number }> => {
    const metadata = getParsedMetadata();
    
    if (!metadata.attributes) return [];
    
    if (Array.isArray(metadata.attributes)) {
      return metadata.attributes;
    }
    
    if (typeof metadata.attributes === 'string') {
      try {
        return JSON.parse(metadata.attributes);
      } catch (e) {
        console.error('Error parsing attributes:', e);
        return [];
      }
    }
    
    return [];
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

  const parsedMetadata = getParsedMetadata();
  const parsedAttributes = getParsedAttributes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-4 overflow-x-hidden">
      <div className="w-full max-w-[100vw] px-4 sm:px-6 md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
        {/* 通知栏 */}
        {notification && (
          <div className={`fixed top-4 left-4 right-4 z-50 p-3 sm:p-4 rounded-lg shadow-2xl border-2 ${
            notification.type === 'success' ? 'bg-emerald-500 border-emerald-600' :
            notification.type === 'error' ? 'bg-red-500 border-red-600' :
            'bg-yellow-500 border-yellow-600'
          } text-white sm:max-w-md sm:left-auto animate-in slide-in-from-top-2 backdrop-blur-sm`}>
            <p className="font-semibold text-sm sm:text-base">{notification.message}</p>
          </div>
        )}

        {/* Header 组件 */}
        <ArrowTowerHeader />

        {/* 页面标题 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-700 mb-2">
            🏆 NFT 铸造查询
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">查看您的 Arrow Tower NFT 铸造状态</p>
        </div>

        {/* 返回地图按钮 - 固定在顶部，始终显示 */}
        <div className="mb-6 flex justify-center">
          <Button
            onClick={() => router.push('/user')}
            variant="outline"
            className="border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold shadow-md"
          >
            ← 返回地图
          </Button>
        </div>

        {/* 主内容区 */}
        <div className="w-full">
          {/* 检查按钮卡片 */}
          {!mintResult && (
            <Card className="p-4 sm:p-8 bg-white/90 backdrop-blur-sm shadow-xl border-2 border-emerald-200 mb-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-3">
                  检查您的 NFT 铸造状态
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  完成路线打卡后，系统将自动为您铸造专属 NFT
                </p>
                <Button
                  onClick={checkMintStatus}
                  disabled={isChecking || !isConnected}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-4 px-8 sm:py-6 sm:px-12 rounded-xl text-base sm:text-lg shadow-lg transition-all"
                >
                  {isChecking ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>查询中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>开始查询</span>
                    </div>
                  )}
                </Button>
                {!isConnected && (
                  <p className="text-amber-600 mt-4 font-semibold">
                    ⚠️ 请先在页面顶部重连钱包
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* 错误提示 */}
          {error && !mintResult && (
            <Card className="p-6 bg-yellow-50 border-2 border-yellow-400 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 mt-1">⚠️</div>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-1">暂未找到 NFT</h3>
                  <p className="text-yellow-700">{error}</p>
                  <Button
                    onClick={checkMintStatus}
                    variant="outline"
                    className="mt-4 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                  >
                    重新查询
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* NFT 展示卡片 */}
          {mintResult?.success && mintResult.nftTokenId && (
            <Card className="overflow-hidden bg-white shadow-2xl border-2 border-emerald-300">
              {/* 成功横幅 */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-4 sm:p-6 text-white text-center">
                <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">铸造成功！🎉</h2>
                <p className="text-sm sm:text-base text-emerald-100">恭喜您获得专属 Arrow Tower NFT</p>
              </div>

              {/* NFT 内容 */}
              <div className="p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  {/* 左侧：NFT 图片 */}
                  <div className="space-y-4">
                    {parsedMetadata.image && (
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-xl border-4 border-emerald-200">
                        <img
                          src={parsedMetadata.image}
                          alt={parsedMetadata.name || 'NFT'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={addNFTToWallet}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg text-sm sm:text-base"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        导入钱包
                      </Button>
                      <Button
                        onClick={viewOnBlockscout}
                        variant="outline"
                        className="flex-1 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-sm sm:text-base"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        区块链浏览器
                      </Button>
                    </div>
                  </div>

                  {/* 右侧：NFT 信息 */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-2">
                        {parsedMetadata.name || 'Arrow Tower NFT'}
                      </h3>
                      {parsedMetadata.route?.name && (
                        <Badge className="bg-emerald-600 text-white text-sm">
                          📍 {parsedMetadata.route.name}
                        </Badge>
                      )}
                    </div>

                    {parsedMetadata.description && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">描述</h4>
                        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                          {parsedMetadata.description}
                        </p>
                      </div>
                    )}

                    {/* Token ID */}
                    <div className="bg-emerald-50 rounded-lg p-3 sm:p-4 border-2 border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-1 sm:mb-2 text-sm sm:text-base">Token ID</h4>
                      <p className="text-emerald-700 font-mono text-base sm:text-lg font-bold">
                        #{mintResult.nftTokenId}
                      </p>
                    </div>

                    {/* 合约地址 */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-2 border-gray-200">
                      <h4 className="font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">合约地址</h4>
                      <div className="flex items-start gap-2">
                        <p className="text-gray-600 font-mono text-xs break-all flex-1">
                          {NFT_CONTRACT_ADDRESS}
                        </p>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(NFT_CONTRACT_ADDRESS);
                            showNotification('success', '已复制合约地址');
                          }}
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                        >
                          📋
                        </Button>
                      </div>
                    </div>

                    {/* 属性列表 */}
                    {parsedAttributes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">属性</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {parsedAttributes.map((attr, index) => {
                            // 检查是否是钱包地址（长文本）
                            const isLongText = String(attr.value).length > 20;
                            const isWalletAddress = attr.trait_type.toLowerCase().includes('wallet') || 
                                                   attr.trait_type.toLowerCase().includes('address');
                            
                            return (
                              <div
                                key={index}
                                className={`bg-white border-2 border-emerald-100 rounded-lg p-2 sm:p-3 ${
                                  isLongText || isWalletAddress ? 'sm:col-span-2' : ''
                                }`}
                              >
                                <p className="text-xs text-gray-500 mb-1 text-center">
                                  {attr.trait_type}
                                </p>
                                <p className={`font-bold text-emerald-900 ${
                                  isWalletAddress ? 'font-mono text-xs break-all text-center' : 
                                  isLongText ? 'text-xs sm:text-sm break-words text-center' : 
                                  'text-sm text-center'
                                }`}>
                                  {attr.value}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 底部提示 */}
                <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                  <p className="text-xs sm:text-sm text-emerald-800 text-center">
                    💡 您可以在区块链浏览器中查看 NFT 的详细信息和交易记录
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}