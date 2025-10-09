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

// 创建NFT元数据
export async function createMetadata(data: CreateMetadataData) {
  try {
    const metadata = await prisma.metadata.create({
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        external_url: data.external_url,
        background_color: data.background_color,
        attributes: data.attributes as any, // 使用类型断言
      },
    });
    
    return metadata;
  } catch (error) {
    console.error('创建元数据失败:', error);
    throw new Error('创建元数据失败');
  }
}

// 根据ID获取NFT元数据
export async function getMetadataById(id: number) {
  try {
    const metadata = await prisma.metadata.findUnique({
      where: { id },
    });
    return metadata;
  } catch (error) {
    console.error('获取元数据失败:', error);
    throw new Error('获取元数据失败');
  }
}

// 更新NFT元数据 - 简化版本
export async function updateMetadata(id: number, data: Partial<CreateMetadataData>) {
  try {
    const metadata = await prisma.metadata.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      } as any, // 使用类型断言
    });
    return metadata;
  } catch (error) {
    console.error('更新元数据失败:', error);
    throw new Error('更新元数据失败');
  }
}

// 删除NFT元数据
export async function deleteMetadata(id: number) {
  try {
    await prisma.metadata.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error('删除元数据失败:', error);
    throw new Error('删除元数据失败');
  }
}