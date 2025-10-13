// src/lib/db/metadata.ts
import { prisma } from './prisma';
import { JsonValue } from '@prisma/client/runtime/library';

// 定义属性项类型
export interface AttributeItem {
  trait_type: string;
  value: string | number;
}

// 定义 Metadata 响应类型
export interface MetadataResponse {
  id: string;
  userId: string;
  routeId: string;
  status: string;
  nftTokenId: string | null;
  mintTxHash: string | null;
  metadata: any;
  createdAt: Date;
  attributes?: AttributeItem[];
}

// 类型守卫，检查是否为对象
function isObject(value: any): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// 安全解析 attributes - 专门处理你的数据格式
function parseAttributesSafe(attributes: any): AttributeItem[] {
  if (!attributes) return [];
  
  try {
    // 如果 attributes 是字符串，尝试解析
    if (typeof attributes === 'string') {
      const parsed = JSON.parse(attributes);
      // 检查解析后的结果是否为数组
      if (Array.isArray(parsed)) {
        return parsed as AttributeItem[];
      }
      return [];
    }
    
    // 如果 attributes 已经是数组，直接返回
    if (Array.isArray(attributes)) {
      return attributes as AttributeItem[];
    }
    
    return [];
  } catch (error) {
    console.error('解析 attributes 失败:', error);
    return [];
  }
}

// 从 metadata 中安全提取 attributes
function extractAttributesFromMetadata(metadata: JsonValue | null): any {
  if (!metadata) return null;
  
  // 如果 metadata 是对象且包含 attributes 属性
  if (isObject(metadata) && 'attributes' in metadata) {
    return metadata.attributes;
  }
  
  // 如果 metadata 本身就是 attributes 数组
  if (Array.isArray(metadata)) {
    return metadata;
  }
  
  // 如果 metadata 是字符串，尝试解析
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      if (isObject(parsed) && 'attributes' in parsed) {
        return parsed.attributes;
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  
  return null;
}

// 获取完整的 metadata 对象
function getFullMetadata(metadata: JsonValue | null): any {
  if (!metadata) return null;
  
  try {
    if (typeof metadata === 'string') {
      return JSON.parse(metadata);
    }
    return metadata;
  } catch {
    return null;
  }
}

export async function getMetadataByTokenId(nftTokenId: string): Promise<MetadataResponse | null> {
  try {
    // 通过 nftTokenId 查询 Voucher 记录
    const voucher = await prisma.voucher.findFirst({
      where: { 
        nftTokenId: nftTokenId 
      },
      include: {
        user: true,
        route: true
      }
    });

    if (!voucher) return null;

    // 安全提取 attributes
    const attributesSource = extractAttributesFromMetadata(voucher.metadata);
    const fullMetadata = getFullMetadata(voucher.metadata);

    // 返回包含解析后 attributes 的数据
    return {
      ...voucher,
      metadata: fullMetadata,
      attributes: parseAttributesSafe(attributesSource),
    } as MetadataResponse;
  } catch (error) {
    console.error('通过 NFT Token ID 获取元数据失败:', error);
    throw new Error('获取元数据失败');
  }
}

// 通过 ID 获取元数据的函数
export async function getMetadataById(id: string): Promise<MetadataResponse | null> {
  try {
    const voucher = await prisma.voucher.findUnique({ 
      where: { id },
      include: {
        user: true,
        route: true
      }
    });
    
    if (!voucher) return null;

    // 安全提取 attributes
    const attributesSource = extractAttributesFromMetadata(voucher.metadata);
    const fullMetadata = getFullMetadata(voucher.metadata);

    return {
      ...voucher,
      metadata: fullMetadata,
      attributes: parseAttributesSafe(attributesSource),
    } as MetadataResponse;
  } catch (error) {
    console.error('通过 ID 获取元数据失败:', error);
    throw new Error('获取元数据失败');
  }
}

// 获取特定属性的值
export function getAttributeValue(attributes: AttributeItem[], traitType: string): string | number | undefined {
  const attribute = attributes.find(attr => attr.trait_type === traitType);
  return attribute?.value;
}