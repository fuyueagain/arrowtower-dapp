'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SignatureConfirmProps {
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  poiName?: string;
  isLoading?: boolean;
}

export function SignatureConfirm({
  open,
  onConfirm,
  onCancel,
  poiName,
  isLoading = false,
}: SignatureConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>签名确认</DialogTitle>
          <DialogDescription>
            请在钱包中确认签名以完成打卡
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 打卡信息 */}
          <Card className="p-4 bg-blue-50">
            <h4 className="font-semibold text-blue-900 mb-2">打卡信息</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>打卡点:</span>
                <span className="font-medium">{poiName || '景点'}</span>
              </div>
              <div className="flex justify-between">
                <span>时间:</span>
                <span>{new Date().toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </Card>

          {/* 签名说明 */}
          <Card className="p-4 bg-gray-50">
            <h4 className="font-semibold text-sm mb-2">🔒 安全说明</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 这是您的身份证明，无需支付费用</li>
              <li>• 签名仅用于验证您的钱包地址</li>
              <li>• 不会转移您的任何资产</li>
              <li>• 请在 MetaMask 弹窗中点击"签名"</li>
            </ul>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>等待签名...</span>
                </div>
              ) : (
                '确认签名'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              size="lg"
            >
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

