'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WalletConnectorProps {
  isConnected: boolean;
  walletAddress: string;
  onConnect: () => Promise<void>;
  isLoading?: boolean;
}

export function WalletConnector({
  isConnected,
  walletAddress,
  onConnect,
  isLoading = false,
}: WalletConnectorProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">钱包连接</h3>
      {isConnected ? (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm text-green-700 font-medium">
              已连接
            </p>
            <p className="text-xs text-green-600 mt-1">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>
          <span className="text-green-600 text-2xl">✓</span>
        </div>
      ) : (
        <Button
          onClick={onConnect}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? '连接中...' : '连接 MetaMask 钱包'}
        </Button>
      )}
    </Card>
  );
}

