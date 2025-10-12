// src/app/api/checkins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
//import { isAuthenticated } from '@/app/api/auth/[...nextauth]/utils';  
import { handleCheckinApproval } from '@/jobs/checkin-handler';

const prisma = new PrismaClient();

// POST /api/checkins
export async function POST(request: NextRequest) {

  // 👉 1. 校验用户登录状态
  // const user = await isAuthenticated(request);
  // if (!user) {
  //   return NextResponse.json(
  //     { success: false, message: '未授权访问，请先登录' },
  //     { status: 401 }
  //   );
  // }

  try {
    const body = await request.json();

    const {
      routeId,
      poiId,
      walletAddress,
      signature,
      message,
      location,
      taskData,
      deviceInfo,
    } = body;

    console.log('收到请求:', JSON.stringify(body, null, 2));

    // 1. 参数校验
    if (!routeId || !poiId || !walletAddress || !signature || !message) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    console.log("prisma.user.findUnique-------",walletAddress);

    // 2. 根据 walletAddress 查找用户
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    console.log("rlt -------");
    console.log(user)

    // const users = await prisma.user.findMany(); // 获取所有用户

    // console.log(`\n📊 共找到 ${users.length} 个用户：\n`);
    // console.log('='.repeat(80));

    //  users.forEach((user, index) => {
    //   console.log(`👤 用户 ${index + 1}:`);
    //   console.log(`   ID:           ${user.id}`);
    //   console.log(`   钱包地址:     ${user.walletAddress}`);
    //   console.log(`   昵称:         ${user.nickname || '未设置'}`);      
    //   console.log('-'.repeat(60));
    // });    

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户未找到' },
        { status: 404 }
      );
    }

    // 3. 验证 POI 是否属于该 Route（防止伪造 routeId）
    const poi = await prisma.pOI.findUnique({
      where: { id: poiId },
    });

    if (!poi || poi.routeId !== routeId) {
      return NextResponse.json(
        { success: false, message: '打卡点不存在或不属于该路线' },
        { status: 400 }
      );
    }

    // 4. 检查是否已打卡（防止重复打卡）
    const existingCheckin = await prisma.checkin.findFirst({
      where: {
        userId: user.id,
        poiId,
      },
    });

    if (existingCheckin) {
      return NextResponse.json(
        { success: false, message: '该打卡点已打卡' },
        { status: 400 }
      );
    }

    // 5. 创建打卡记录
    const checkin = await prisma.checkin.create({
      data: {
        userId: user.id,
        routeId,
        poiId,
        signature,
        message,
        taskData: JSON.stringify(taskData), // 存为 JSON 字符串
        status: 'approved', // 简化逻辑，直接通过（可后续改为 pending 审核）
      },
      include: {
        poi: true,
      },
    });

    // ✅ 事件驱动：检查是否完成路线并触发 NFT
    await handleCheckinApproval(String(user.id), routeId);

    // 6. 计算路线进度
    const completedCheckins = await prisma.checkin.count({
      where: {
        userId: user.id,
        routeId,
        status: 'approved',
      },
    });

    const totalPOIs = await prisma.pOI.count({
      where: { routeId },
    });

    const isRouteCompleted = completedCheckins >= totalPOIs;

    // 获取下一个未完成的 POI（按 order 升序）
    const nextPOI = await prisma.pOI.findFirst({
      where: {
        routeId,
        order: {
          gt: poi.order,
        },
      },
      orderBy: { order: 'asc' },
    });

    // 7. 构造响应
    const responseData = {
      checkinId: checkin.id,
      status: checkin.status,
      poi: {
        id: checkin.poi.id,
        name: checkin.poi.name,
        order: checkin.poi.order,
      },
      routeProgress: {
        completed: completedCheckins,
        total: totalPOIs,
        nextPOI: nextPOI ? { id: nextPOI.id, name: nextPOI.name } : null,
        isRouteCompleted,
      },
      nftStatus: {
        willMint: isRouteCompleted,
        remainingPOIs: Math.max(0, totalPOIs - completedCheckins),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('打卡失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}



//请求示例（POST /api/checkins）
// {
//   "routeId": "cl3x456abc",
//   "poiId": "cl4y789def",
//   "walletAddress": "0x742d35Cc6634C0532925a3b8D6B3981d6F2F4a5a",
//   "signature": "0x1234567890abcdef...",
//   "message": "ArrowTower Checkin: poi=cl4y789def, nonce=xyz123...",
//   "location": {
//     "latitude": 30.123567,
//     "longitude": 103.456890,
//     "accuracy": 12.5,
//     "timestamp": "2025-10-01T12:30:00Z"
//   },
//   "taskData": {
//     "type": "quiz",
//     "answer": "A",
//     "photoUrl": "/uploads/checkin_123_photo.jpg"
//   },
//   "deviceInfo": {
//     "fingerprint": "device_fp_123",
//     "userAgent": "Mozilla/5.0..."
//   }
// }



//成功响应

// {
//   "success": true,
//   "data": {
//     "checkinId": "chk_abc123",
//     "status": "approved",
//     "poi": {
//       "id": "cl4y789def",
//       "name": "传统民居",
//       "order": 2
//     },
//     "routeProgress": {
//       "completed": 2,
//       "total": 3,
//       "nextPOI": {
//         "id": "cl5z012ghi",
//         "name": "古井"
//       },
//       "isRouteCompleted": false
//     },
//     "nftStatus": {
//       "willMint": false,
//       "remainingPOIs": 1
//     },
//     "timestamp": "2025-10-01T12:30:05Z"
//   },
//   "timestamp": "2025-10-01T12:30:05Z"
// }





// GET /api/checkins?routeId=...&poiId=...&status=...&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 过滤参数
    const routeId = searchParams.get('routeId');
    const poiId = searchParams.get('poiId');
    const status = searchParams.get('status');

    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    if (routeId) where.routeId = routeId;
    if (poiId) where.poiId = poiId;
    if (status) where.status = status;

    // 查询总数量
    const total = await prisma.checkin.count({ where });

    // 查询打卡记录（带关联数据）
    const checkins = await prisma.checkin.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        poi: {
          select: {
            id: true,
            name: true,
            order: true,
            latitude: true,
            longitude: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        photos: {
          select: {
            url: true,
            mimeType: true,
          },
          take: 1, // 只取一张作为代表（可选）
        },
      },
    });

    // 格式化响应数据
    const formattedCheckins = checkins.map((checkin) => {
      // 模拟 location（实际可从数据库字段扩展）
      const latitude = checkin.poi.latitude;
      const longitude = checkin.poi.longitude;
      const distance = Math.random() * 100; // 模拟用户打卡时的距离（米）

      // 尝试解析 taskData（JSON 字符串）
      let taskData = null;
      try {
        taskData = checkin.taskData ? JSON.parse(checkin.taskData) : null;
      } catch (e) {
        taskData = { raw: checkin.taskData }; // 解析失败则保留原始内容
      }

      return {
        id: checkin.id,
        poi: {
          id: checkin.poi.id,
          name: checkin.poi.name,
          order: checkin.poi.order,
        },
        route: {
          id: checkin.route.id,
          name: checkin.route.name,
        },
        status: checkin.status,
        taskData,
        location: {
          latitude,
          longitude,
          distance: parseFloat(distance.toFixed(2)),
        },
        createdAt: checkin.createdAt.toISOString(),
        user: {
          nickname: checkin.user.nickname,
          avatar: checkin.user.avatar,
        },
        photo: checkin.photos[0]?.url || null, // 附带一张照片（可选）
      };
    });

    // 计算总页数
    const pages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          checkins: formattedCheckins,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('获取打卡记录失败:', error);
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

//测试
//http://localhost:3000/api/checkins?routeId=route_1&poiId=poi_4&status=approved

// {
//   "success": true,
//   "data": {
//     "checkins": [
//       {
//         "id": "checkin_abc123",
//         "poi": {
//           "id": "poi_002",
//           "name": "传统民居",
//           "order": 2
//         },
//         "route": {
//           "id": "route_001",
//           "name": "文化探索路线"
//         },
//         "status": "approved",
//         "taskData": {
//           "type": "quiz",
//           "answer": "A",
//           "correct": true
//         },
//         "location": {
//           "latitude": 30.123567,
//           "longitude": 103.456890,
//           "distance": 15.2
//         },
//         "user": {
//           "nickname": "探险家小张",
//           "avatar": "/avatars/user_789.jpg"
//         },
//         "photo": "/uploads/checkin_abc123_photo.jpg",
//         "createdAt": "2025-10-01T12:30:00Z"
//       }
//     ],
//     "pagination": {
//       "page": 1,
//       "limit": 20,
//       "total": 45,
//       "pages": 3
//     }
//   },
//   "timestamp": "2025-10-01T12:35:00Z"
// }