// components/CopyAddress.tsx
"use client";

import { useState, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check } from "lucide-react";

function shortenAddress(address?: `0x${string}`) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A";
}

export interface CopyAddressProps {
  address?: `0x${string}`;
  className?: string;
}

export const CopyAddress: React.FC<CopyAddressProps> = ({
  address,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    // 1.5s 后重置状态，以便再次复制时提示生效
    setTimeout(() => setCopied(false), 1500);
  }, [address]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center cursor-pointer ${className ?? ""}`}
            onClick={copyAddress}
          >
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
  );
};

export default CopyAddress;
