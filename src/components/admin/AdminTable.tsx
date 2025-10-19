// src/components/admin/AdminTable.tsx

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

interface AdminTableProps<T> {
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
}

export function AdminTable<T extends { id: string }>({
  title,
  icon,
  data,
  columns,
  loading = false,
  error = null,
  total,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
  addButtonText = '新增'
}: AdminTableProps<T>) {
  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl border-2 border-emerald-200">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">{title}</h2>
            {total !== undefined && (
              <p className="text-sm text-gray-600 mt-1">共 {total} 条记录</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              🔄 刷新
            </Button>
          )}
          {onAdd && (
            <Button
              onClick={onAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              ➕ {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg mb-4">
          ⚠️ 错误：{error}
        </div>
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          📭 暂无数据
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-emerald-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-gray-900">
                      {col.render
                        ? col.render(item[col.key as keyof T], item)
                        : String(item[col.key as keyof T] || '-')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {onEdit && (
                          <Button
                            onClick={() => onEdit(item)}
                            variant="outline"
                            size="sm"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            ✏️ 编辑
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            onClick={() => onDelete(item)}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            🗑️ 删除
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}