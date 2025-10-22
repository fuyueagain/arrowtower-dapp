//src/components/admin/AdminTable.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface AdminTableProps<T extends { id: string }> {
  title: string;
  icon: string;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  total?: number;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRefresh?: () => void;
  addButtonText?: string;
  showQRButton?: boolean; // 是否显示二维码按钮(仅用于POI)
}

export function AdminTable<T extends { id: string }>({
  title,
  icon,
  data,
  columns,
  loading,
  error,
  total,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
  addButtonText = "新增",
  showQRButton = false,
}: AdminTableProps<T>) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentQR, setCurrentQR] = useState<{ name: string; url: string; dataUrl: string } | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_ARROW_TOWER_BASE_URL || "https://arrowtower.netlify.app/";

  // 生成带Logo的单个二维码（因为 AdminTable 是泛型，这里使用 any 来兼容 POI 结构）
  const generateQRWithLogo = async (poi: any) => {
    setGeneratingQR(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法获取canvas上下文");

      const url = `${baseUrl}user/poi/${poi.order}`;
      const size = 500;
      canvas.width = size;
      canvas.height = size;

      await new Promise<void>((resolve, reject) => {
        QRCode.toCanvas(
          canvas,
          url,
          {
            width: size,
            margin: 2,
            color: {
              dark: "#059669",
              light: "#FFFFFF",
            },
            errorCorrectionLevel: "H",
          },
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            const logo = new Image();
            logo.crossOrigin = "anonymous";
            logo.onload = () => {
              const logoSize = size * 0.25;
              const logoX = (size - logoSize) / 2;
              const logoY = (size - logoSize) / 2;

              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
              ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

              resolve();
            };
            // 如果 logo 加载失败也继续（容错）
            logo.onerror = () => resolve();
            logo.src = "/arrowtower.jpg";
          }
        );
      });

      const dataUrl = canvas.toDataURL("image/png");
      setCurrentQR({ name: poi.name || "poi", url, dataUrl });
      setQrModalOpen(true);
    } catch (err: any) {
      alert("生成二维码失败: " + (err?.message ?? String(err)));
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleDownloadQR = () => {
    if (!currentQR) return;
    const link = document.createElement("a");
    link.download = `${currentQR.name}-二维码.png`;
    link.href = currentQR.dataUrl;
    link.click();
  };

  const handlePrintQR = () => {
    if (!currentQR) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("请允许弹出窗口以打印二维码");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentQR.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px;
            }
            img { 
              width: 400px; 
              border: 2px solid #059669;
              border-radius: 8px;
              margin: 20px 0;
            }
            h2 { color: #059669; }
            p { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Arrow Tower 打卡点</h1>
          <h2>${currentQR.name}</h2>
          <img src="${currentQR.dataUrl}" alt="${currentQR.name}" />
          <p>${currentQR.url}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (loading) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">加载中...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-red-200">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <Button onClick={onRefresh} className="bg-emerald-600 hover:bg-emerald-700">
            重试
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200 overflow-hidden">
        {/* 表头 */}
        <div className="p-6 bg-gradient-to-r from-emerald-100 to-teal-100 border-b-2 border-emerald-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
                <span>{icon}</span>
                <span>{title}</span>
              </h2>
              <p className="text-gray-600 mt-1">
                共 <Badge className="bg-emerald-600">{total}</Badge> 条记录
              </p>
            </div>
            <div className="flex gap-3">
              {onAdd && (
                <Button onClick={() => onAdd?.()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  ➕ {addButtonText}
                </Button>
              )}
              <Button onClick={() => onRefresh?.()} className="bg-blue-600 hover:bg-blue-700 text-white">
                🔄 刷新
              </Button>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                {columns.map((col: Column<T>) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left text-sm font-semibold text-emerald-800 border-b-2 border-emerald-200"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-800 border-b-2 border-emerald-200">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                data.map((item: T, index: number) => (
                  <tr
                    key={(item as any).id || index}
                    className="border-b border-emerald-100 hover:bg-emerald-50/50 transition-colors"
                  >
                    {columns.map((col: Column<T>) => (
                      <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                        {col.render ? col.render((item as any)[col.key], item) : (item as any)[col.key] ?? "-"}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {showQRButton && (
                          <Button
                            onClick={() => generateQRWithLogo(item)}
                            disabled={generatingQR}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
                          >
                            {generatingQR ? "⏳" : "🔳"}
                          </Button>
                        )}
                        <Button
                          onClick={() => onEdit?.(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                        >
                          ✏️ 编辑
                        </Button>
                        <Button
                          onClick={() => onDelete?.(item)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                        >
                          🗑️ 删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 二维码预览模态框 */}
      {qrModalOpen && currentQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModalOpen(false)}>
          <Card className="bg-white p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-emerald-700 mb-4 text-center">{currentQR.name}</h3>
            <div className="bg-white p-4 border-2 border-emerald-300 rounded-lg mb-4">
              <img src={currentQR.dataUrl} alt={currentQR.name} className="w-full h-auto" />
            </div>
            <p className="text-xs text-gray-500 text-center mb-4 break-all">{currentQR.url}</p>
            <div className="flex gap-3">
              <Button onClick={handleDownloadQR} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                📥 下载
              </Button>
              <Button onClick={handlePrintQR} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                🖨️ 打印
              </Button>
              <Button onClick={() => setQrModalOpen(false)} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white">
                关闭
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
