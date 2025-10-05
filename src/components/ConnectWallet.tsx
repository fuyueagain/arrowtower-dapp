"use client";

import { useState, useEffect } from "react";
import { 
  useAccount, 
  useConnect, 
  useDisconnect,
  useChainId,
 /*  Config,
  Connector */
} from "wagmi";
import { metaMask, walletConnect } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Check, Copy, ExternalLink } from "lucide-react";

// 确保项目ID已正确设置
// const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export function ConnectWallet() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, isPending/* , connectors  */} = useConnect({
    mutation: {
      onError: (error: Error) => {
        console.error("Connection error:", error);
        setError(error.message);
        // 5秒后清除错误
        setTimeout(() => setError(null), 5000);
      },
    },
  });
  const { disconnect } = useDisconnect();

  // 当连接状态变化时重置错误
  useEffect(() => {
    if (isConnected) {
      setError(null);
    }
  }, [isConnected]);

  // 处理地址复制
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 获取可用的连接器
  const metaMaskConnector = metaMask();
/*   const walletConnectConnector = walletConnect({
    projectId: projectId!,
    metadata: {
      name: "Arrowtower",
      description: "Arrowtower",
      url: "https://Arrowtower.netlify.app/",
      icons: ["https://Arrowtower.netlify.app/logo.png"]
    }
  }); */

  // 查看区块浏览器
  const viewOnExplorer = () => {
    if (!address) return;
    
    let explorerUrl;
    switch (chainId) {
      // 添加更多链支持
      default:
        explorerUrl = `https://blockscout-asset-hub.parity-chains-scw.parity.io/${address}`;
    }
    
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {isConnected ? (
        <>
          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-pointer" onClick={copyAddress}>
                    <span className="text-sm font-medium">
                      {shortenAddress(address)}
                    </span>
                    {copied ? (
                      <Check className="h-4 w-4 ml-1 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 ml-1 text-gray-500" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? "Copied!" : "Copy address"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ExternalLink 
                    className="h-4 w-4 text-gray-500 cursor-pointer" 
                    onClick={viewOnExplorer}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  View on explorer
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={() => disconnect()} 
            className="w-full"
          >
            Disconnect
          </Button>
        </>
      ) : (
        <div className="flex flex-col space-y-3 w-full">
          <Button
            variant="default"
            onClick={() => connect({ connector: metaMaskConnector })}
            disabled={isPending}
            className="w-full flex justify-center items-center"
          >
            {isPending ? "Connecting..." : "Connect MetaMask"}
          </Button>
          
   {/*        {projectId && (
            <Button
              variant="outline"
              onClick={() => connect({ connector: walletConnectConnector })}
              disabled={isPending}
              className="w-full flex justify-center items-center"
            >
              {isPending ? "Connecting..." : "Connect WalletConnect"}
            </Button>
          )} */}
          
          {error && (
            <div className="flex items-center text-red-500 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{error}</span>
            </div>
          )}
          
 {/*          {!projectId && (
            <div className="text-amber-500 text-xs text-center mt-1">
              WalletConnect project ID is missing. Check your environment variables.
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}

// 地址缩短辅助函数
function shortenAddress(address?: `0x${string}`) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A";
}