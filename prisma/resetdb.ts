import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
     console.log('🌱 清空原来数据库...')

  // 清空现有数据
  await prisma.user.deleteMany()
  await prisma.checkinPhoto.deleteMany()
  await prisma.checkin.deleteMany()
  await prisma.voucher.deleteMany()
  await prisma.pOI.deleteMany()
  await prisma.route.deleteMany()
  await prisma.metadata.deleteMany()
  console.log('🌱 开始数据库初始化...')

  // ==================== 1. 管理员用户初始化 ====================
  console.log('👤 检查管理员用户...')
  
  const ADMIN_ADDRESSold = process.env.ADMIN_ADDRESS||"0x85E9D949b0897DAb7B3Cf8B29f46aCEa16aB3271"
 
  const ADMIN_ADDRESS=ADMIN_ADDRESSold.toLowerCase().trim();
  
  if (!ADMIN_ADDRESS) {
    console.error('❌ 请设置 ADMIN_ADDRESS 环境变量')
    process.exit(1)
  }

  // 检查是否已存在管理员用户
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: 'admin'
    }
  })

  if (existingAdmin) {
    // 如果已存在管理员，更新钱包地址
    console.log('🔄 更新现有管理员钱包地址...')
    await prisma.user.update({
      where: {
        id: existingAdmin.id
      },
      data: {
        walletAddress: ADMIN_ADDRESS
      }
    })
    console.log('✅ 管理员钱包地址已更新')
  } else {
    // 如果不存在管理员，创建新管理员
    console.log('👑 创建新管理员用户...')
    await prisma.user.create({
      data: {
        id: `admin_${Date.now()}`,
        walletAddress: ADMIN_ADDRESS,
        walletType: 'metamask',
        nickname: '系统管理员',
        role: 'admin',
        avatar: '',
        totalRoutes: 0
      }
    })
    console.log('✅ 管理员用户创建完成')
  }

  // 验证管理员用户配置
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'admin',
      walletAddress: ADMIN_ADDRESS
    }
  })

  if (adminUser) {
    console.log('✅ 管理员用户配置验证成功')
    console.log(`   - 钱包地址: ${adminUser.walletAddress}`)
    console.log(`   - 用户角色: ${adminUser.role}`)
    console.log(`   - 用户ID: ${adminUser.id}`)
  } else {
    console.error('❌ 管理员用户配置失败')
    process.exit(1)
  }

  // ==================== 2. 检查并初始化数据表 ====================

  // 检查 Route 表是否有数据
  const routeCount = await prisma.route.count()
  if (routeCount === 0) {
    console.log('📍 创建路线数据...')
    
    const route1 = await prisma.route.upsert({
      where: { id: 'route_1' },
      update: {},
      create: {
        id: 'route_1',
        name: '箭塔村创业探索',
        description: '箭塔村创业路径',
        coverImage: null,
        difficulty: 'medium',
        estimatedTime: 120,
        poiCount: 3,
        nftCollection: null,
        isActive: true,
      },
    })

    const route2 = await prisma.route.upsert({
      where: { id: 'route_2' },
      update: {},
      create: {
        id: 'route_2',
        name: '箭塔村文化历史',
        description: '箭塔村文化历史',
        coverImage: null,
        difficulty: 'medium',
        estimatedTime: 120,
        poiCount: 4,
        nftCollection: null,
        isActive: true,
      },
    })

    console.log('✅ 路线创建完成:', route1.name, route2.name)
  } else {
    console.log(`📊 Route 表已有 ${routeCount} 条数据，跳过初始化`)
  }

  // 检查 POI 表是否有数据
  const poiCount = await prisma.pOI.count()
  if (poiCount === 0) {
    console.log('📌 创建 POI 数据...')

    // 创建所有指定的POI点
    const pois = await Promise.all([
      // route_2 的 POI
      prisma.pOI.upsert({
        where: { id: 'poi_0' },
        update: {},
        create: {
          id: 'poi_0',
          routeId: 'route_2',
          name: '箭塔',
          description: '箭塔，是成都市蒲江县甘溪镇的箭塔村的灵魂地标。它是一座拥有千年历史的古老佛塔，其建筑形态极为独特，底部被挖空，呈现出罕见的"上大下小"的倒置结构，令人过目难忘。它曾成功抵御了汶川、芦山两次破坏性极强的地震，在周遭的变动中屹立不倒，这份传奇经历为其增添了无数神秘色彩。如今，箭塔不仅是村民心中的精神图腾，也吸引着无数游客前来一睹其真容。它仿佛一位无言的见证者，静静诉说着千年的风霜与故事，等待着您来聆听和探寻。',
          latitude: 39.9042,
          longitude: 116.4074,
          radius: 50,
          taskType: 'location',
          taskContent: null,
          order: 0,
        },
      }),
      prisma.pOI.upsert({
        where: { id: 'poi_2' },
        update: {},
        create: {
          id: 'poi_2',
          routeId: 'route_2',
          name: '箭塔村——山花茶社',
          description: '山花茶社是箭塔村的特色茶馆',
          latitude: 41.3786,
          longitude: 116.0156,
          radius: 50,
          taskType: 'photo',
          taskContent: null,
          order: 2,
        },
      }),
      prisma.pOI.upsert({
        where: { id: 'poi_20' },
        update: {},
        create: {
          id: 'poi_20',
          routeId: 'route_2',
          name: '箭塔村——箭塔村村史馆',
          description: '箭塔村村史馆记录了箭塔村的历史',
          latitude: 39.9042,
          longitude: 116.4074,
          radius: 50,
          taskType: 'location',
          taskContent: null,
          order: 20,
        },
      }),
      prisma.pOI.upsert({
        where: { id: 'poi_21' },
        update: {},
        create: {
          id: 'poi_21',
          routeId: 'route_2',
          name: '箭塔村——周先生的百草园',
          description: '周先生的百草园是箭塔村的特色景点',
          latitude: 39.9042,
          longitude: 116.4074,
          radius: 50,
          taskType: 'location',
          taskContent: null,
          order: 21,
        },
      }),

      // route_1 的 POI
      prisma.pOI.upsert({
        where: { id: 'poi_9' },
        update: {},
        create: {
          id: 'poi_9',
          routeId: 'route_1',
          name: '箭塔村——猫鼻子餐厅',
          description: '猫鼻子餐厅是箭塔村的特色餐厅',
          latitude: 39.9042,
          longitude: 116.4074,
          radius: 50,
          taskType: 'location',
          taskContent: null,
          order: 9,
        },
      }),
      prisma.pOI.upsert({
        where: { id: 'poi_11' },
        update: {},
        create: {
          id: 'poi_11',
          routeId: 'route_1',
          name: '箭塔村——吾乡乡村创业孵化器',
          description: '吾乡乡村创业孵化器是箭塔村的创业空间',
          latitude: 39.9042,
          longitude: 116.4074,
          radius: 50,
          taskType: 'location',
          taskContent: null,
          order: 11,
        },
      }),
      prisma.pOI.upsert({
        where: { id: 'poi_22' },
        update: {},
        create: {
          id: 'poi_22',
          routeId: 'route_1',
          name: '箭塔村——青年创客园地',
          description: '青年创客园地是箭塔村的创客空间',
          latitude: 39.9042,
          longitude: 116.4074,
          radius: 50,
          taskType: 'location',
          taskContent: null,
          order: 22,
        },
      }),
    ])

    console.log('✅ POI 创建完成，共创建', pois.length, '个打卡点')
  } else {
    console.log(`📊 POI 表已有 ${poiCount} 条数据，跳过初始化`)
  }

  // 检查 Metadata 表是否有数据
  const metadataCount = await prisma.metadata.count()
  if (metadataCount === 0) {
    console.log('🎨 创建 Metadata 数据...')

    // 使用顺序创建而不是Promise.all，确保严格按照顺序执行
    const metadata1 = await prisma.metadata.create({
      data: {
        name: "箭塔村探索者 #1",
        description: "成功完成箭塔村文化探索路线的数字纪念",
        image: "https://arrowtower.netlify.app/pic/img_11.svg",
        external_url: "https://arrowtower.netlify.app/api/metadata/1",
        background_color: "4A90E2",
        attributes: JSON.stringify([
          {
            "trait_type": "路线名称",
            "value": "文化探索路线"
          },
          {
            "trait_type": "完成时间",
            "value": "2025-10-01"
          },
          {
            "trait_type": "POI数量", 
            "value": "3"
          },
          {
            "trait_type": "难度等级",
            "value": "中等"
          },
          {
            "trait_type": "探索评分",
            "value": "95"
          }
        ]),
      },
    })

    const metadata2 = await prisma.metadata.create({
      data: {
        name: "箭塔村探索者 #2",
        description: "成功完成箭塔村创业探索路线的数字纪念",
        image: "https://arrowtower.netlify.app/pic/img_9.svg",
        external_url: "https://arrowtower.netlify.app/api/metadata/2",
        background_color: "4A90E2",
        attributes: JSON.stringify([
          {
            "trait_type": "路线名称",
            "value": "创业探索路线"
          },
          {
            "trait_type": "完成时间",
            "value": "2025-10-02"
          },
          {
            "trait_type": "POI数量", 
            "value": "4"
          },
          {
            "trait_type": "难度等级",
            "value": "中等"
          },
          {
            "trait_type": "探索评分",
            "value": "92"
          }
        ]),
      },
    })

    const metadata3 = await prisma.metadata.create({
      data: {
        name: "箭塔村探索者 #3",
        description: "成功完成箭塔村文化探索路线的数字纪念",
        image: "https://arrowtower.netlify.app/pic/img_22.svg",
        external_url: "https://arrowtower.netlify.app/api/metadata/3",
        background_color: "4A90E2",
        attributes: JSON.stringify([
          {
            "trait_type": "路线名称",
            "value": "文化探索路线"
          },
          {
            "trait_type": "完成时间",
            "value": "2025-10-03"
          },
          {
            "trait_type": "POI数量", 
            "value": "5"
          },
          {
            "trait_type": "难度等级",
            "value": "困难"
          },
          {
            "trait_type": "探索评分",
            "value": "98"
          }
        ]),
      },
    })

    const metadata4 = await prisma.metadata.create({
      data: {
        name: "箭塔村探索者 #4",
        description: "成功完成箭塔村创业探索路线的数字纪念",
        image: "https://arrowtower.netlify.app/pic/img_11.svg",
        external_url: "https://arrowtower.netlify.app/api/metadata/4",
        background_color: "4A90E2",
        attributes: JSON.stringify([
          {
            "trait_type": "路线名称",
            "value": "创业探索路线"
          },
          {
            "trait_type": "完成时间",
            "value": "2025-10-04"
          },
          {
            "trait_type": "POI数量", 
            "value": "3"
          },
          {
            "trait_type": "难度等级",
            "value": "简单"
          },
          {
            "trait_type": "探索评分",
            "value": "88"
          }
        ]),
      },
    })

    const metadata5 = await prisma.metadata.create({
      data: {
        name: "箭塔村探索者 #5",
        description: "成功完成箭塔村文化探索路线的数字纪念",
        image: "https://arrowtower.netlify.app/pic/img_9.svg",
        external_url: "https://arrowtower.netlify.app/api/metadata/5",
        background_color: "4A90E2",
        attributes: JSON.stringify([
          {
            "trait_type": "路线名称",
            "value": "文化探索路线"
          },
          {
            "trait_type": "完成时间",
            "value": "2025-10-05"
          },
          {
            "trait_type": "POI数量", 
            "value": "6"
          },
          {
            "trait_type": "难度等级",
            "value": "中等"
          },
          {
            "trait_type": "探索评分",
            "value": "96"
          }
        ]),
      },
    })

    console.log('✅ Metadata 创建完成，共创建 5 条记录')
  } else {
    console.log(`📊 Metadata 表已有 ${metadataCount} 条数据，跳过初始化`)
  }

  // 检查 Checkin 表是否有数据
  const checkinCount = await prisma.checkin.count()
  if (checkinCount === 0) {
    console.log('📝 Checkin 表为空，无需初始化数据')
  } else {
    console.log(`📊 Checkin 表已有 ${checkinCount} 条数据`)
  }

  console.log('🎉 数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })