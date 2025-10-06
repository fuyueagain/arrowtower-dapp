// src/app/api/admin/checkins/pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 管理员 Token（实际项目中应使用 JWT 或数据库验证）
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-super-secret-admin-token';

// 辅助函数：计算两点间距离（Haversine 公式），单位：米
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// GET /api/admin/checkins/pending
export async function GET(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '未授权访问' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, message: '无效的管理员令牌' },
        { status: 403 }
      );
    }

    // 2. 查询所有待审核的打卡记录（status = 'pending'）
    const pendingCheckins = await prisma.checkin.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            walletAddress: true,
            id: true,
          },
        },
        poi: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
          },
        },
        route: true,
        photos: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
    });

    // 3. 获取每个用户的过往打卡次数（用于显示经验）
    const userIds = pendingCheckins.map((c) => c.user.id);
    const userCheckinCounts = await prisma.checkin.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: 'approved',
      },
      _count: {
        id: true,
      },
    });

    const userCountMap = userCheckinCounts.reduce((map, item) => {
      map[item.userId] = item._count.id;
      return map;
    }, {} as Record<string, number>);

    // 4. 格式化响应数据
    const formattedCheckins = pendingCheckins.map((checkin) => {
      // 模拟用户提交的位置（实际应来自前端传入的 latitude/longitude）
      // 假设你在 Checkin 表中增加了 latitude 和 longitude 字段
      const submittedLat = checkin.latitude || checkin.poi.latitude + (Math.random() - 0.5) * 0.001;
      const submittedLon = checkin.longitude || checkin.poi.longitude + (Math.random() - 0.5) * 0.001;
      const accuracy = checkin.accuracy || 25.0; // 米

      const distance = calculateDistance(
        checkin.poi.latitude,
        checkin.poi.longitude,
        submittedLat,
        submittedLon
      );

      // 系统标记原因（示例）
      const flaggedReasons: string[] = [];
      if (distance > 50) {
        flaggedReasons.push('location_discrepancy');
      }
      if (accuracy > 30) {
        flaggedReasons.push('low_gps_accuracy');
      }

      // 解析 taskData
      let taskData: any = null;
      try {
        taskData = checkin.taskData ? JSON.parse(checkin.taskData) : {};
      } catch (e) {
        taskData = { raw: checkin.taskData };
      }

      // 如果是照片任务，补充 photoUrl
      if (checkin.photos.length > 0) {
        taskData.photoUrl = checkin.photos[0].url;
      }

      return {
        id: checkin.id,
        user: {
          walletAddress: checkin.user.walletAddress,
          previousCheckins: userCountMap[checkin.user.id] || 0,
        },
        poi: {
          name: checkin.poi.name,
          expectedLocation: {
            latitude: checkin.poi.latitude,
            longitude: checkin.poi.longitude,
          },
        },
        submittedLocation: {
          latitude: submittedLat,
          longitude: submittedLon,
          distance: parseFloat(distance.toFixed(2)), // 米
          accuracy,
        },
        taskData,
        flaggedReasons,
        submittedAt: checkin.createdAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          checkins: formattedCheckins,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('获取待审核打卡失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '服务器内部错误',
        error: error.message,
      },
      { status: 500 }
    );
  }
}