// src/app/api/route_list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const difficulty = searchParams.get('difficulty') || undefined;
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (difficulty) where.difficulty = difficulty;
    if (isActive !== null && isActive !== undefined)
      where.isActive = isActive === 'true';

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.route.count({ where }),
    ]);

    const formattedRoutes = routes.map((route) => ({
      id: route.id,
      name: route.name,
      description: route.description || null,
      coverImage: route.coverImage || null,
      difficulty: route.difficulty,
      estimatedTime: route.estimatedTime,
      poiCount: route.poiCount,
      isActive: route.isActive,
      userProgress: {
        completedPOIs: 0,
        status: 'not_started', // 可后续扩展
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          routes: formattedRoutes,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('获取路线失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}