import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const MINTER_CONTRACT = process.env.NEXT_PUBLIC_MINTER_CONTRACT as `0x${string}`;

const ABI = [
  {
    inputs: [],
    name: "getContractStats",
    outputs: [
      { internalType: "uint256", name: "totalMinted", type: "uint256" },
      { internalType: "bool", name: "isPaused", type: "bool" },
      { internalType: "address", name: "nftAddress", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

export function ChainStats() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data, isError, isLoading, refetch } = useReadContract({
    address: MINTER_CONTRACT,
    abi: ABI,
    functionName: 'getContractStats',
  });

  const handleRefresh = () => {
    refetch();
    setLastUpdate(new Date());
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-sm shadow-xl border-2 border-emerald-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⛓️</span>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">链上数据统计</h2>
            <p className="text-sm text-gray-600 mt-1">
              合约地址: {MINTER_CONTRACT?.slice(0, 6)}...{MINTER_CONTRACT?.slice(-4)}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
              <span>刷新中...</span>
            </div>
          ) : (
            <>🔄 刷新</>
          )}
        </Button>
      </div>

      {isError ? (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg">
          ⚠️ 无法连接到区块链网络，请检查钱包连接
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">查询链上数据中...</span>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 总铸造数量 */}
          <div className="bg-white/80 p-6 rounded-xl border-2 border-emerald-100 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">已铸造 NFT</span>
              <span className="text-3xl">🎨</span>
            </div>
            <p className="text-4xl font-bold text-emerald-700">
              {data[0]?.toString() || '0'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total Minted</p>
          </div>

          {/* 合约状态 */}
          <div className="bg-white/80 p-6 rounded-xl border-2 border-emerald-100 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">合约状态</span>
              <span className="text-3xl">{data[1] ? '⏸️' : '✅'}</span>
            </div>
            <Badge 
              className={`text-lg px-4 py-2 ${
                data[1] 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-green-500 text-white'
              }`}
            >
              {data[1] ? '已暂停' : '运行中'}
            </Badge>
            <p className="text-sm text-gray-500 mt-2">Contract Status</p>
          </div>

          {/* NFT 合约地址 */}
          <div className="bg-white/80 p-6 rounded-xl border-2 border-emerald-100 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">NFT 合约</span>
              <span className="text-3xl">📜</span>
            </div>
            <p className="text-sm font-mono text-emerald-700 break-all">
              {data[2] ? `${String(data[2]).slice(0, 10)}...${String(data[2]).slice(-8)}` : '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">NFT Contract</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 text-xs text-gray-500 text-right">
        最后更新: {lastUpdate.toLocaleString('zh-CN')}
      </div>
    </Card>
  );
}