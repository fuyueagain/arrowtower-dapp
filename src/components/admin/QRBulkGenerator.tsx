import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode';

interface POI {
  id: string;
  routeId: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  taskType: string;
  order: number;
}

interface QRBulkGeneratorProps {
  pois: POI[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function QRBulkGenerator({ pois, loading, error, onRefresh }: QRBulkGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<{ poi: POI; dataUrl: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const baseUrl = process.env.NEXT_PUBLIC_ARROW_TOWER_BASE_URL || 'https://arrowtower.netlify.app/';

  // 生成带Logo的二维码
  const generateQRWithLogo = async (poi: POI): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取canvas上下文'));
        return;
      }

      const url = `${baseUrl}user/poi/${poi.order}`;
      const size = 400;
      canvas.width = size;
      canvas.height = size;

      // 生成二维码
      QRCode.toCanvas(canvas, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#059669', // 翠绿色
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // 高容错率,支持Logo遮挡
      }, (error) => {
        if (error) {
          reject(error);
          return;
        }

        // 加载Logo图片
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          // 在二维码中心绘制Logo
          const logoSize = size * 0.25; // Logo占二维码25%
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;

          // 绘制白色背景(防止Logo透明部分显示二维码)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

          // 绘制Logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

          resolve(canvas.toDataURL('image/png'));
        };
        logo.onerror = () => {
          // 如果Logo加载失败,返回不带Logo的二维码
          resolve(canvas.toDataURL('image/png'));
        };
        logo.src = '/arrowtower.jpg';
      });
    });
  };

  // 批量生成二维码
  const handleGenerateAll = async () => {
    setGenerating(true);
    const results: { poi: POI; dataUrl: string }[] = [];

    try {
      for (const poi of pois) {
        const dataUrl = await generateQRWithLogo(poi);
        results.push({ poi, dataUrl });
      }
      setQrCodes(results);
    } catch (err: any) {
      alert('生成二维码失败: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // 下载单个二维码
  const handleDownloadSingle = (poi: POI, dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `打卡点${poi.order}-${poi.name}.png`;
    link.href = dataUrl;
    link.click();
  };

  // 批量下载所有二维码
  const handleDownloadAll = () => {
    qrCodes.forEach(({ poi, dataUrl }) => {
      setTimeout(() => {
        handleDownloadSingle(poi, dataUrl);
      }, 100 * qrCodes.indexOf({ poi, dataUrl })); // 延迟下载避免浏览器阻止
    });
  };

  // 打印所有二维码
  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以打印二维码');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>打卡点二维码打印</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .qr-item { 
              page-break-inside: avoid; 
              margin: 20px; 
              text-align: center;
              display: inline-block;
              width: 45%;
              vertical-align: top;
            }
            .qr-item img { 
              width: 300px; 
              height: 300px; 
              border: 2px solid #059669;
              border-radius: 8px;
            }
            .qr-item h3 { 
              color: #059669; 
              margin: 10px 0;
            }
            .qr-item p { 
              color: #666; 
              font-size: 14px;
            }
            @media print {
              .qr-item { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; color: #059669;">Arrow Tower 打卡点二维码</h1>
          ${qrCodes.map(({ poi, dataUrl }) => `
            <div class="qr-item">
              <img src="${dataUrl}" alt="${poi.name}" />
              <h3>打卡点 ${poi.order}: ${poi.name}</h3>
              <p>${baseUrl}user/poi/${poi.order}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
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

  if (pois.length === 0) {
    return (
      <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
        <div className="text-center text-gray-500">
          <p className="text-xl mb-2">🔳</p>
          <p>暂无打卡点数据</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
              🔳 打卡点二维码批量生成
            </h2>
            <p className="text-gray-600 mt-1">
              共 <Badge className="bg-emerald-600">{pois.length}</Badge> 个打卡点
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateAll}
              disabled={generating || qrCodes.length > 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {generating ? '生成中...' : qrCodes.length > 0 ? '✅ 已生成' : '🔳 批量生成'}
            </Button>
            {qrCodes.length > 0 && (
              <>
                <Button
                  onClick={handleDownloadAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  📥 下载全部
                </Button>
                <Button
                  onClick={handlePrintAll}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  🖨️ 打印全部
                </Button>
                <Button
                  onClick={() => setQrCodes([])}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  🔄 重新生成
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* 二维码网格 */}
      {qrCodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map(({ poi, dataUrl }) => (
            <Card
              key={poi.id}
              className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200 hover:shadow-xl transition-shadow"
            >
              <div className="text-center">
                <Badge className="bg-emerald-600 mb-3">打卡点 {poi.order}</Badge>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{poi.name}</h3>
                {poi.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{poi.description}</p>
                )}
                
                <div className="relative bg-white p-3 rounded-lg border-2 border-emerald-300 mb-4">
                  <img
                    src={dataUrl}
                    alt={poi.name}
                    className="w-full h-auto rounded"
                  />
                </div>

                <p className="text-xs text-gray-500 mb-3 break-all">
                  {baseUrl}user/poi/{poi.order}
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadSingle(poi, dataUrl)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    📥 下载
                  </Button>
                  <Button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head><title>${poi.name}</title></head>
                            <body style="text-align: center; padding: 20px;">
                              <h2>${poi.name}</h2>
                              <img src="${dataUrl}" style="width: 400px;" />
                              <p>${baseUrl}user/poi/${poi.order}</p>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        setTimeout(() => printWindow.print(), 500);
                      }
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm"
                  >
                    🖨️ 打印
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}