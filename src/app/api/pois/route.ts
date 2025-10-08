// src/app/api/pois/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json(
        { success: false, message: '缺少 routeId 参数' },
        { status: 400 }
      );
    }

    // 查询该路线下的所有 POI，按 order 排序
    const pois = await prisma.poi.findMany({
      where: { routeId },
      orderBy: { order: 'asc' },
    });

    // 如果没有找到 POI
    if (pois.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '该路线暂无打卡点',
      });
    }

    // 格式化响应
    const formattedPois = pois.map((poi) => ({
      id: poi.id,
      name: poi.name,
      description: poi.description,
      latitude: poi.latitude,
      longitude: poi.longitude,
      radius: poi.radius,
      taskType: poi.taskType,
      taskContent: poi.taskContent,
      order: poi.order,
    }));

    return NextResponse.json({
      success: true,
      data: formattedPois,
      total: formattedPois.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('获取打卡点失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误', error: error.message },
      { status: 500 }
    );
  }
}