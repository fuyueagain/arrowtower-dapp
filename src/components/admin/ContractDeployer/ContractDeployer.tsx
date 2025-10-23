'use client';
import React, { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { encodeAbiParameters, encodeFunctionData } from 'viem';

// 确保这两个 JSON 文件存在并路径正确
import ArrowTowerNFTArtifact from '@/contracts/ArrowTowerNFT.json';
import ArrowTowerMinterArtifact from '@/contracts/ArrowTowerMinter.json';

interface DeploymentStep {
  id: string;
  label: string;
  status: 'pending' | 'deploying' | 'success' | 'error';
  txHash?: string;
  address?: string;
  error?: string;
}

export function ContractDeployer() {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // NFT 配置参数
  const [nftName, setNftName] = useState('Arrow Tower Village NFT');
  const [nftSymbol, setNftSymbol] = useState('ATVNFT');
  const [nftBaseURI, setNftBaseURI] = useState('https://arrowtower.netlify.app/api/metadata/');

  // 部署状态
  const [isDeploying, setIsDeploying] = useState(false);
  const [steps, setSteps] = useState<DeploymentStep[]>([
    { id: 'nft', label: '部署 ArrowTowerNFT 合约', status: 'pending' },
    { id: 'minter', label: '部署 ArrowTowerMinter 合约', status: 'pending' },
    { id: 'bind', label: '绑定 NFT 和 Minter', status: 'pending' }
  ]);

  // 合约地址
  const [nftAddress, setNftAddress] = useState<string>('');
  const [minterAddress, setMinterAddress] = useState<string>('');

  // 更新步骤状态
  const updateStep = (stepId: string, updates: Partial<DeploymentStep>) => {
    setSteps(prev =>
      prev.map(step => (step.id === stepId ? { ...step, ...updates } : step))
    );
  };

  // 使用 viem 编码构造函数参数并返回 0x 前缀的 hex 字符串
  const encodeConstructorArgs = (types: string[], values: any[]): `0x${string}` => {
    const abiParams = types.map(t => ({ type: t } as const));
    // encodeAbiParameters 返回 '0x...' 格式
    return encodeAbiParameters(abiParams, values) as `0x${string}`;
  };

  // 部署 NFT 合约
  const deployNFT = async (): Promise<string> => {
    if (!walletClient || !publicClient || !userAddress) {
      throw new Error('钱包未连接或客户端未就绪');
    }

    try {
      updateStep('nft', { status: 'deploying' });

      const bytecode = ArrowTowerNFTArtifact.bytecode as `0x${string}`;
      if (!bytecode || bytecode === '0x') {
        throw new Error('找不到 ArrowTowerNFT 的 bytecode，请检查 JSON 文件');
      }

      // 构造参数: (string name, string symbol, string baseURI)
      const constructorData = encodeConstructorArgs(
        ['string', 'string', 'string'],
        [nftName, nftSymbol, nftBaseURI]
      );

      const deployData = (bytecode + constructorData.slice(2)) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        account: userAddress,
        to: undefined, // contract creation => to undefined
        data: deployData,
        value: BigInt(0)
      });

      updateStep('nft', { txHash: hash });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // viem 的 receipt 在合约创建时通常包含 contractAddress
      const contractAddr = (receipt as any).contractAddress as string | undefined;
      if (!contractAddr) {
        updateStep('nft', { status: 'error', error: '未获取到合约地址' });
        throw new Error('未获取到合约地址');
      }

      setNftAddress(contractAddr);
      updateStep('nft', { status: 'success', address: contractAddr });

      return contractAddr;
    } catch (error: any) {
      updateStep('nft', {
        status: 'error',
        error: error?.message || '部署失败'
      });
      throw error;
    }
  };

  // 部署 Minter 合约（构造参数: address nftContract）
  const deployMinter = async (nftAddr: string): Promise<string> => {
    if (!walletClient || !publicClient || !userAddress) {
      throw new Error('钱包未连接或客户端未就绪');
    }

    try {
      updateStep('minter', { status: 'deploying' });

      const bytecode = ArrowTowerMinterArtifact.bytecode as `0x${string}`;
      if (!bytecode || bytecode === '0x') {
        throw new Error('找不到 ArrowTowerMinter 的 bytecode，请检查 JSON 文件');
      }

      const constructorData = encodeConstructorArgs(['address'], [nftAddr]);
      const deployData = (bytecode + constructorData.slice(2)) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        account: userAddress,
        to: undefined,
        data: deployData,
        value: BigInt(0)
      });

      updateStep('minter', { txHash: hash });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const contractAddr = (receipt as any).contractAddress as string | undefined;
      if (!contractAddr) {
        updateStep('minter', { status: 'error', error: '未获取到合约地址' });
        throw new Error('未获取到合约地址');
      }

      setMinterAddress(contractAddr);
      updateStep('minter', { status: 'success', address: contractAddr });

      return contractAddr;
    } catch (error: any) {
      updateStep('minter', {
        status: 'error',
        error: error?.message || '部署失败'
      });
      throw error;
    }
  };

  // 绑定合约：调用 ArrowTowerNFT.setMinterContract(address)
  const bindContracts = async (nftAddr: string, minterAddr: string) => {
    if (!walletClient || !publicClient || !userAddress) {
      throw new Error('钱包未连接或客户端未就绪');
    }

    try {
      updateStep('bind', { status: 'deploying' });

      // 使用 viem encodeFunctionData（需要 NFT ABI 中包含 setMinterContract）
      const callData = encodeFunctionData({
        abi: ArrowTowerNFTArtifact.abi as any,
        functionName: 'setMinterContract',
        args: [minterAddr]
      }) as `0x${string}`;

      const hash = await walletClient.sendTransaction({
        account: userAddress,
        to: nftAddr as `0x${string}`,
        data: callData,
        value:BigInt(0) 
      });

      updateStep('bind', { txHash: hash });

      await publicClient.waitForTransactionReceipt({ hash });

      updateStep('bind', { status: 'success' });
    } catch (error: any) {
      updateStep('bind', {
        status: 'error',
        error: error?.message || '绑定失败'
      });
      throw error;
    }
  };

  // 开始部署流程
  const startDeployment = async () => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (!walletClient) {
      alert('钱包客户端未就绪');
      return;
    }

    setIsDeploying(true);

    try {
      // 阶段 1: 部署 NFT
      const nftAddr = await deployNFT();

      // 阶段 2: 部署 Minter
      const minterAddr = await deployMinter(nftAddr);

      // 阶段 3: 绑定合约
      await bindContracts(nftAddr, minterAddr);

      alert('🎉 所有合约部署成功！');
    } catch (error: any) {
      console.error('部署错误:', error);
      alert(`部署失败: ${error?.message ?? String(error)}`);
    } finally {
      setIsDeploying(false);
    }
  };

  // 重置部署
  const resetDeployment = () => {
    setSteps([
      { id: 'nft', label: '部署 ArrowTowerNFT 合约', status: 'pending' },
      { id: 'minter', label: '部署 ArrowTowerMinter 合约', status: 'pending' },
      { id: 'bind', label: '绑定 NFT 和 Minter', status: 'pending' }
    ]);
    setNftAddress('');
    setMinterAddress('');
    setIsDeploying(false);
  };

  // 状态图标 & color
  const getStatusIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'deploying':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };
  const getStatusColor = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500';
      case 'deploying':
        return 'bg-blue-500 animate-pulse';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
      <div className="space-y-6">
        {/* 标题 */}
        <div className="flex items-center gap-3 border-b-2 border-emerald-200 pb-4">
          <span className="text-3xl">🚀</span>
          <h2 className="text-2xl font-bold text-emerald-800">智能合约部署</h2>
        </div>

        {/* 连接状态 */}
        {!isConnected && (
          <Alert className="border-yellow-400 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              ⚠️ 请先连接钱包才能部署合约
            </AlertDescription>
          </Alert>
        )}

        {/* NFT 配置参数 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>⚙️</span>
            NFT 配置参数
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NFT 名称</label>
              <input
                type="text"
                value={nftName}
                onChange={e => setNftName(e.target.value)}
                disabled={isDeploying}
                className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Arrow Tower Village NFT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NFT 符号</label>
              <input
                type="text"
                value={nftSymbol}
                onChange={e => setNftSymbol(e.target.value)}
                disabled={isDeploying}
                className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ATVNFT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">基础 URI</label>
              <input
                type="text"
                value={nftBaseURI}
                onChange={e => setNftBaseURI(e.target.value)}
                disabled={isDeploying}
                className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="https://arrowtower.netlify.app/metadata/"
              />
            </div>
          </div>
        </div>

        {/* 部署步骤 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>📋</span> 部署进度
          </h3>

          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                step.status === 'deploying'
                  ? 'border-blue-400 bg-blue-50'
                  : step.status === 'success'
                  ? 'border-green-400 bg-green-50'
                  : step.status === 'error'
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(step.status)}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{index + 1}. {step.label}</p>
                    {step.status === 'deploying' && (
                      <p className="text-sm text-blue-600 animate-pulse">部署中，请在钱包中确认交易...</p>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(step.status)}>
                  {step.status === 'pending' && '待部署'}
                  {step.status === 'deploying' && '部署中'}
                  {step.status === 'success' && '成功'}
                  {step.status === 'error' && '失败'}
                </Badge>
              </div>

              {step.txHash && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">交易哈希:</p>
                  <code className="block mt-1 p-2 bg-white rounded border border-gray-200 text-xs break-all">{step.txHash}</code>
                </div>
              )}

              {step.address && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">合约地址:</p>
                  <code className="block mt-1 p-2 bg-white rounded border border-gray-200 text-xs break-all font-mono">{step.address}</code>
                </div>
              )}

              {step.error && (
                <div className="mt-2 text-sm text-red-600">
                  <p className="font-medium">错误信息:</p>
                  <p className="mt-1 p-2 bg-red-50 rounded border border-red-200">{step.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 部署结果 */}
        {(nftAddress || minterAddress) && (
          <div className="space-y-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
            <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
              <span>🎯</span> 部署结果
            </h3>

            {nftAddress && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">ArrowTowerNFT 合约地址:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white rounded border-2 border-emerald-200 text-sm break-all font-mono">{nftAddress}</code>
                  <Button onClick={() => navigator.clipboard.writeText(nftAddress)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2">📋 复制</Button>
                </div>
              </div>
            )}

            {minterAddress && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">ArrowTowerMinter 合约地址:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white rounded border-2 border-emerald-200 text-sm break-all font-mono">{minterAddress}</code>
                  <Button onClick={() => navigator.clipboard.writeText(minterAddress)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2">📋 复制</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Button
            onClick={startDeployment}
            disabled={!isConnected || isDeploying}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDeploying ? (
              <>
                <span className="animate-spin mr-2">🔄</span>
                部署中...
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                开始部署
              </>
            )}
          </Button>

          {(nftAddress || minterAddress || steps.some(s => s.status === 'error')) && (
            <Button onClick={resetDeployment} disabled={isDeploying} className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed">
              <span className="mr-2">🔄</span> 重置
            </Button>
          )}
        </div>

        {/* 提示信息 */}
        <Alert className="border-blue-400 bg-blue-50">
          <AlertDescription className="text-blue-800 text-sm">
            <p className="font-semibold mb-2">💡 部署说明:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>确保钱包中有足够的 PAS 支付 Gas 费用</li>
              <li>部署过程需要 3 个步骤，每步都需要钱包确认交易</li>
              <li>请耐心等待每笔交易确认完成</li>
              <li>部署完成后会显示合约地址，请妥善保存</li>
              <li>需要先导入合约的 bytecode JSON 文件才能使用</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* 技术说明 */}
        <Alert className="border-purple-400 bg-purple-50">
          <AlertDescription className="text-purple-800 text-sm">
            <p className="font-semibold mb-2">🔧 技术配置要求:</p>
            <p className="mb-2">在使用此组件前，需要完成以下配置：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>将编译好的 <code className="bg-white px-1 py-0.5 rounded">ArrowTowerNFT.json</code> 放到 <code className="bg-white px-1 py-0.5 rounded">@/contracts/</code> 目录</li>
              <li>将编译好的 <code className="bg-white px-1 py-0.5 rounded">ArrowTowerMinter.json</code> 放到 <code className="bg-white px-1 py-0.5 rounded">@/contracts/</code> 目录</li>
              <li>确保 JSON 中包含合法的 <code className="bg-white px-1 py-0.5 rounded">bytecode</code> 与 <code className="bg-white px-1 py-0.5 rounded">abi</code></li>
              <li>已连接钱包并允许发送交易</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}
