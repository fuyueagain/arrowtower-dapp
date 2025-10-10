// src/lib/db/metadata.ts
import { prisma } from './prisma';

export interface Attribute {
  trait_type: string;
  value: string | number;
}

export interface CreateMetadataData {
  name: string;
  description: string;
  image: string;
  external_url: string;
  background_color: string;
  attributes: Attribute[];
}

export interface MetadataResponse {
  id: number;
  name: string;
  description: string;
  image: string;
  external_url: string;
  background_color: string;
  attributes: Attribute[];
  createdAt: Date;
  updatedAt: Date;
}

/** 类型守卫：运行时验证某个值是否为 Attribute */
function isAttribute(obj: unknown): obj is Attribute {
  if (typeof obj !== 'object' || obj === null) return false;
  const anyObj = obj as Record<string, unknown>;
  const hasTrait = typeof anyObj.trait_type === 'string';
  const val = anyObj.value;
  const hasValue = typeof val === 'string' || typeof val === 'number';
  return hasTrait && hasValue;
}

/**
 * 解析 attributes（兼容 String 存储或 Json 存储）
 * - raw 可能是 string（JSON）、可能是 array（Json field）、也可能是 object
 */
function parseAttributesSafe(raw: unknown): Attribute[] {
  if (raw == null) return [];

  // 情形 1：已经是数组 -> 过滤并返回合法项
  if (Array.isArray(raw)) {
    return raw.filter(isAttribute) as Attribute[];
  }

  // 情形 2：字符串（可能是 JSON 字符串）
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(isAttribute) as Attribute[];
      // 如果解析后是单个对象且符合 Attribute，则包成数组返回
      if (isAttribute(parsed)) return [parsed];
      return [];
    } catch {
      return [];
    }
  }

  // 情形 3：单个对象（非数组）
  if (typeof raw === 'object') {
    if (isAttribute(raw)) return [raw];
    // 如果对象不是 Attribute，则可能是其他结构，返回空
    return [];
  }

  // 其他类型（number/boolean/...） -> 返回空数组
  return [];
}

// ---------- CRUD functions ----------
export async function createMetadata(data: CreateMetadataData): Promise<MetadataResponse> {
  try {
    // 注意：若 schema 中 attributes 是 String 则保持 stringify；若是 Json 则可直接传 data.attributes
    const dbData = {
      name: data.name,
      description: data.description,
      image: data.image,
      external_url: data.external_url,
      background_color: data.background_color,
      attributes: JSON.stringify(data.attributes || []),
    };

    const metadata = await prisma.metadata.create({ data: dbData });

    return {
      ...metadata,
      attributes: parseAttributesSafe((metadata as any).attributes),
    } as MetadataResponse;
  } catch (error) {
    console.error('创建元数据失败:', error);
    throw new Error('创建元数据失败');
  }
}

export async function getMetadataById(id: number): Promise<MetadataResponse | null> {
  try {
    const metadata = await prisma.metadata.findUnique({ where: { id } });
    if (!metadata) return null;

    return {
      ...metadata,
      attributes: parseAttributesSafe((metadata as any).attributes),
    } as MetadataResponse;
  } catch (error) {
    console.error('获取元数据失败:', error);
    throw new Error('获取元数据失败');
  }
}

export async function updateMetadata(
  id: number,
  data: Partial<CreateMetadataData>
): Promise<MetadataResponse> {
  try {
    const dbData: Record<string, any> = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.image !== undefined) dbData.image = data.image;
    if (data.external_url !== undefined) dbData.external_url = data.external_url;
    if (data.background_color !== undefined) dbData.background_color = data.background_color;
    if (data.attributes !== undefined) {
      dbData.attributes = JSON.stringify(data.attributes || []);
    }

    const metadata = await prisma.metadata.update({
      where: { id },
      data: dbData,
    });

    return {
      ...metadata,
      attributes: parseAttributesSafe((metadata as any).attributes),
    } as MetadataResponse;
  } catch (error) {
    console.error('更新元数据失败:', error);
    throw new Error('更新元数据失败');
  }
}

export async function deleteMetadata(id: number): Promise<{ success: boolean }> {
  try {
    await prisma.metadata.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('删除元数据失败:', error);
    throw new Error('删除元数据失败');
  }
}
