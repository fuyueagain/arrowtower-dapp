'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowTowerHeader } from '@/components/maps/ArrowTowerHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminModal } from '@/components/admin/AdminModal';
import { ChainStats } from '@/components/admin/ChainStats';
import { QRBulkGenerator } from '@/components/admin/QRBulkGenerator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type TabType = 'chain' | 'users' | 'routes' | 'pois' | 'checkins' | 'vouchers' | 'qr_bulk';

interface User {
  id: string;
  walletAddress: string;
  walletType: string;
  nickname: string;
  role: string;
  avatar: string | null;
  totalRoutes: number;
  createdAt: string;
}

interface Route {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  estimatedTime: number;
  poiCount: number;
  isActive: boolean;
}

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

interface Checkin {
  id: string;
  userId: string;
  routeId: string;
  poiId: string;
  status: string;
  createdAt: string;
  user?: { nickname: string };
  poi?: { name: string };
}

interface Voucher {
  id: string;
  userId: string;
  routeId: string;
  status: string;
  nftTokenId: string | null;
  createdAt: string;
  user?: { nickname: string };
  route?: { name: string };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('chain');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 数据状态
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  
  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'update'>('create');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentId, setCurrentId] = useState<string>('');

  // 权限检查
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  // 加载数据
  const fetchData = async (type: TabType) => {
    if (type === 'chain' || type === 'qr_bulk') return; // 这些标签页有自己的数据处理逻辑
    
    setLoading(true);
    setError(null);
    
    try {
      const endpoints: Record<TabType, string> = {
        chain: '',
        qr_bulk: '',
        users: '/api/admin/users',
        routes: '/api/admin/routes',
        pois: '/api/admin/pois',
        checkins: '/api/admin/checkins',
        vouchers: '/api/admin/vouchers'
      };
      
      const res = await fetch(endpoints[type]);
      const result = await res.json();
      
      if (result.success) {
        switch (type) {
          case 'users':
            setUsers(result.data?.users || []);
            break;
          case 'routes':
            setRoutes(result.data?.routes || []);
            break;
          case 'pois':
            setPois(result.data || []);
            break;
          case 'checkins':
            setCheckins(result.data?.checkins || []);
            break;
          case 'vouchers':
            setVouchers(result.data?.vouchers || []);
            break;
        }
      } else {
        setError(result.message || '加载失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchData(activeTab);
    }
  }, [activeTab, session]);

  // 新增
  const handleAdd = () => {
    setModalType('create');
    setCurrentId('');
    
    const defaults: Record<TabType, any> = {
      chain: {},
      qr_bulk: {},
      users: {
        id: crypto.randomUUID(),
        walletAddress: '',
        walletType: 'metamask',
        nickname: '',
        role: 'user',
        avatar: ''
      },
      routes: {
        name: '',
        description: '',
        difficulty: 'medium',
        estimatedTime: 60,
        poiCount: 3,
        isActive: true
      },
      pois: {
        routeId: routes[0]?.id || '',
        name: '',
        description: '',
        latitude: 0,
        longitude: 0,
        radius: 50,
        taskType: 'photo',
        order: 1
      },
      checkins: {},
      vouchers: {}
    };
    
    setFormData(defaults[activeTab] || {});
    setModalOpen(true);
  };

  // 编辑
  const handleEdit = (item: any) => {
    setModalType('update');
    setCurrentId(item.id);
    setFormData({ ...item });
    setModalOpen(true);
  };

  // 删除
  const handleDelete = async (item: any) => {
    if (!confirm('确定要删除吗?此操作不可恢复!')) return;
    
    try {
      const endpoints: Record<TabType, string> = {
        chain: '',
        qr_bulk: '',
        users: `/api/admin/users/${item.id}`,
        routes: `/api/admin/routes/${item.id}`,
        pois: `/api/admin/pois/${item.id}`,
        checkins: `/api/admin/checkins/${item.id}`,
        vouchers: `/api/admin/vouchers/${item.id}`
      };
      
      const res = await fetch(endpoints[activeTab], { method: 'DELETE' });
      
      if (res.ok) {
        alert('删除成功');
        fetchData(activeTab);
      } else {
        const data = await res.json();
        alert(`删除失败: ${data.message}`);
      }
    } catch (err: any) {
      alert('网络错误: ' + err.message);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const endpoints: Record<TabType, string> = {
        chain: '',
        qr_bulk: '',
        users: modalType === 'create' ? '/api/admin/users' : `/api/admin/users/${currentId}`,
        routes: modalType === 'create' ? '/api/admin/routes' : `/api/admin/routes/${currentId}`,
        pois: modalType === 'create' ? '/api/admin/pois' : `/api/admin/pois/${currentId}`,
        checkins: `/api/admin/checkins/${currentId}`,
        vouchers: `/api/admin/vouchers/${currentId}`
      };
      
      const method = modalType === 'create' ? 'POST' : 'PUT';
      
      const res = await fetch(endpoints[activeTab], {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        alert(modalType === 'create' ? '创建成功' : '更新成功');
        setModalOpen(false);
        fetchData(activeTab);
      } else {
        const data = await res.json();
        alert(`操作失败: ${data.message}`);
      }
    } catch (err: any) {
      alert('网络错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 表单字段配置
  const getModalFields = () => {
    const fieldsMap: Record<TabType, any[]> = {
      chain: [],
      qr_bulk: [],
      users: [
        { name: 'id', label: '用户ID', type: 'text', required: true, disabled: modalType === 'update' },
        { name: 'walletAddress', label: '钱包地址', type: 'text', required: true, disabled: modalType === 'update' },
        { name: 'walletType', label: '钱包类型', type: 'select', options: [
          { value: 'metamask', label: 'MetaMask' },
          { value: 'phantom', label: 'Phantom' },
          { value: 'walletconnect', label: 'WalletConnect' }
        ]},
        { name: 'nickname', label: '昵称', type: 'text', required: true },
        { name: 'avatar', label: '头像URL', type: 'text' },
        { name: 'role', label: '角色', type: 'select', options: [
          { value: 'user', label: '普通用户' },
          { value: 'admin', label: '管理员' }
        ]}
      ],
      routes: [
        { name: 'name', label: '路线名称', type: 'text', required: true },
        { name: 'description', label: '描述', type: 'textarea' },
        { name: 'difficulty', label: '难度', type: 'select', options: [
          { value: 'easy', label: '简单' },
          { value: 'medium', label: '中等' },
          { value: 'hard', label: '困难' }
        ]},
        { name: 'estimatedTime', label: '预计时长(分钟)', type: 'number', required: true },
        { name: 'poiCount', label: '打卡点数量', type: 'number', required: true },
        { name: 'isActive', label: '是否激活', type: 'checkbox', placeholder: '激活此路线' }
      ],
      pois: [
        { name: 'routeId', label: '所属路线', type: 'select', required: true, options: routes.map(r => ({ value: r.id, label: r.name })) },
        { name: 'name', label: '打卡点名称', type: 'text', required: true },
        { name: 'description', label: '描述', type: 'textarea' },
        { name: 'latitude', label: '纬度', type: 'number', required: true },
        { name: 'longitude', label: '经度', type: 'number', required: true },
        { name: 'radius', label: '半径(米)', type: 'number', required: true },
        { name: 'taskType', label: '任务类型', type: 'select', options: [
          { value: 'photo', label: '拍照' },
          { value: 'quiz', label: '答题' },
          { value: 'scan', label: '扫码' }
        ]},
        { name: 'order', label: '顺序', type: 'number', required: true }
      ],
      checkins: [
        { name: 'status', label: '状态', type: 'select', options: [
          { value: 'pending', label: '待审核' },
          { value: 'approved', label: '已通过' },
          { value: 'rejected', label: '已拒绝' },
          { value: 'flagged', label: '已标记' }
        ]}
      ],
      vouchers: [
        { name: 'status', label: '状态', type: 'select', options: [
          { value: 'pending', label: '待处理' },
          { value: 'minting', label: '铸造中' },
          { value: 'completed', label: '已完成' },
          { value: 'failed', label: '失败' }
        ]},
        { name: 'nftTokenId', label: 'NFT Token ID', type: 'text' }
      ]
    };
    
    return fieldsMap[activeTab] || [];
  };

  // 表格列配置
  const getTableColumns = () => {
    const columnsMap: Record<TabType, any[]> = {
      chain: [],
      qr_bulk: [],
      users: [
        { key: 'avatar', label: '头像', render: (val: string) => (
          <img src={val || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full border-2 border-emerald-200" />
        )},
        { key: 'nickname', label: '昵称' },
        { key: 'walletAddress', label: '钱包地址', render: (val: string) => `${val.slice(0, 6)}...${val.slice(-4)}` },
        { key: 'role', label: '角色', render: (val: string) => (
          <Badge className={val === 'admin' ? 'bg-red-500' : 'bg-green-500'}>{val}</Badge>
        )},
        { key: 'totalRoutes', label: '完成路线' },
        { key: 'createdAt', label: '注册时间', render: (val: string) => new Date(val).toLocaleString('zh-CN') }
      ],
      routes: [
        { key: 'name', label: '路线名称' },
        { key: 'description', label: '描述', render: (val: string) => val?.slice(0, 50) + '...' || '-' },
        { key: 'difficulty', label: '难度', render: (val: string) => (
          <Badge className={
            val === 'easy' ? 'bg-green-500' :
            val === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
          }>{val}</Badge>
        )},
        { key: 'estimatedTime', label: '预计时长', render: (val: number) => `${val}分钟` },
        { key: 'poiCount', label: '打卡点数' },
        { key: 'isActive', label: '状态', render: (val: boolean) => (
          <Badge className={val ? 'bg-green-500' : 'bg-gray-500'}>{val ? '激活' : '未激活'}</Badge>
        )}
      ],
      pois: [
        { key: 'name', label: '打卡点名称' },
        { key: 'order', label: '顺序' },
        { key: 'latitude', label: '纬度', render: (val: number) => val.toFixed(6) },
        { key: 'longitude', label: '经度', render: (val: number) => val.toFixed(6) },
        { key: 'radius', label: '半径', render: (val: number) => `${val}米` },
        { key: 'taskType', label: '任务类型', render: (val: string) => (
          <Badge className="bg-blue-500">{val}</Badge>
        )}
      ],
      checkins: [
        { key: 'user', label: '用户', render: (val: any) => val?.nickname || '-' },
        { key: 'poi', label: '打卡点', render: (val: any) => val?.name || '-' },
        { key: 'status', label: '状态', render: (val: string) => (
          <Badge className={
            val === 'approved' ? 'bg-green-500' :
            val === 'rejected' ? 'bg-red-500' :
            val === 'flagged' ? 'bg-yellow-500' : 'bg-gray-500'
          }>{val}</Badge>
        )},
        { key: 'createdAt', label: '打卡时间', render: (val: string) => new Date(val).toLocaleString('zh-CN') }
      ],
      vouchers: [
        { key: 'user', label: '用户', render: (val: any) => val?.nickname || '-' },
        { key: 'route', label: '路线', render: (val: any) => val?.name || '-' },
        { key: 'status', label: '状态', render: (val: string) => (
          <Badge className={
            val === 'completed' ? 'bg-green-500' :
            val === 'minting' ? 'bg-blue-500' :
            val === 'failed' ? 'bg-red-500' : 'bg-gray-500'
          }>{val}</Badge>
        )},
        { key: 'nftTokenId', label: 'Token ID', render: (val: string) => val || '-' },
        { key: 'createdAt', label: '创建时间', render: (val: string) => new Date(val).toLocaleString('zh-CN') }
      ]
    };
    
    return columnsMap[activeTab] || [];
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'chain', label: '链上数据', icon: '⛓️' },
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'routes', label: '路线管理', icon: '🗺️' },
    { id: 'pois', label: '打卡点管理', icon: '📍' },
    { id: 'qr_bulk', label: '打卡点二维码', icon: '🔳' },
    { id: 'checkins', label: '打卡记录', icon: '✅' },
    { id: 'vouchers', label: 'NFT凭证', icon: '🎨' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* 头部 */}
        <ArrowTowerHeader />

        {/* 标签页导航 */}
        <Card className="mb-6 p-2 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-emerald-200">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* 内容区域 */}
        {activeTab === 'chain' ? (
          <ChainStats />
        ) : activeTab === 'qr_bulk' ? (
          <QRBulkGenerator
            pois={pois}
            loading={loading}
            error={error}
            onRefresh={() => fetchData('pois')}
          />
        ) : (
          <AdminTable<User | Route | POI | Checkin | Voucher>
            title={tabs.find(t => t.id === activeTab)?.label || ''}
            icon={tabs.find(t => t.id === activeTab)?.icon || ''}
            data={
              activeTab === 'users' ? users :
              activeTab === 'routes' ? routes :
              activeTab === 'pois' ? pois :
              activeTab === 'checkins' ? checkins :
              vouchers
            }
            columns={getTableColumns()}
            loading={loading}
            error={error}
            total={
              activeTab === 'users' ? users.length :
              activeTab === 'routes' ? routes.length :
              activeTab === 'pois' ? pois.length :
              activeTab === 'checkins' ? checkins.length :
              vouchers.length
            }
            onAdd={activeTab !== 'checkins' && activeTab !== 'vouchers' ? handleAdd : undefined}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={() => fetchData(activeTab)}
            addButtonText="新增"
            showQRButton={activeTab === 'pois'}
          />
        )}

        {/* 模态框 */}
        <AdminModal
          open={modalOpen}
          title={`${modalType === 'create' ? '新增' : '编辑'}${tabs.find(t => t.id === activeTab)?.label}`}
          fields={getModalFields()}
          formData={formData}
          onChange={(name, value) => setFormData(prev => ({ ...prev, [name]: value }))}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={loading}
        />
      </div>
    </div>
  );
}