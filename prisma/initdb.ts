import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { existsSync } from 'fs'

// 按Next.js优先级加载环境变量
if (existsSync('.env.local')) {
  config({ path: '.env.local' })
} else {
  config({ path: '.env' })
}

const prisma = new PrismaClient()

async function main() {
       console.log('🌱 清空原来数据库...')

  // 清空现有数据
  await prisma.voucher.deleteMany()
  await prisma.checkin.deleteMany()
  await prisma.pOI.deleteMany()
  await prisma.checkinPhoto.deleteMany()
  await prisma.route.deleteMany()
  await prisma.user.deleteMany()

  
  
  
 
  
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
        walletType: 'polkavm',
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
        poiCount: 3,
        nftCollection: null,
        isActive: true,
      },
    })

    const route3= await prisma.route.upsert({
      where: { id: 'route_3' },
      update: {},
      create: {
        id: 'route_3',
        name: '测试封闭路线',
        description: '测试封闭路线',
        coverImage: null,
        difficulty: 'medium',
        estimatedTime: 120,
        poiCount: 3,
        nftCollection: null,
        isActive: false,
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
          routeId: 'route_3',
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

  // 检查 Voucher 表是否有数据
  const voucherCount = await prisma.voucher.count()
  if (voucherCount === 0) {
    console.log('🎫 创建 Voucher 数据...')

    // 获取管理员用户ID
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (!adminUser) {
      console.error('❌ 未找到管理员用户，无法创建Voucher数据')
      process.exit(1)
    }

    // 创建6条Voucher记录
    const vouchers = await Promise.all([
      // 第一条：pending状态的凭证
      prisma.voucher.create({
        data: {
          id: 'voucher_1',
          userId: adminUser.id,
          routeId: 'route_1',
          status: 'pending',
          nftTokenId: "1",
          mintTxHash: null,
          metadata: {
            name: "箭塔村创业探索凭证 #1",
            description: "完成箭塔村创业探索路线的数字凭证",
            image: "https://arrowtower.netlify.app/pic/img_11.svg",
            external_url: "https://arrowtower.netlify.app/api/voucher/1",
            background_color: "4A90E2",
            attributes: [
              {
                "trait_type": "路线名称",
                "value": "箭塔村创业探索"
              },
              {
                "trait_type": "状态",
                "value": "待铸造"
              },
              {
                "trait_type": "POI数量", 
                "value": "3"
              },
              {
                "trait_type": "预估时间",
                "value": "120分钟"
              }
            ]
          }
        }
      }),

      // 第二条：minted状态的凭证
      prisma.voucher.create({
        data: {
          id: 'voucher_2',
          userId: adminUser.id,
          routeId: 'route_2',
          status: 'minted',
          nftTokenId: '2',
          mintTxHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd',
          metadata: {
            name: "箭塔村文化历史凭证 #2",
            description: "成功完成箭塔村文化历史探索的NFT纪念凭证",
            image: "https://arrowtower.netlify.app/pic/img_9.svg",
            external_url: "https://arrowtower.netlify.app/api/voucher/1001",
            background_color: "E24A4A",
            attributes: [
              {
                "trait_type": "路线名称",
                "value": "箭塔村文化历史"
              },
              {
                "trait_type": "状态",
                "value": "已铸造"
              },
              {
                "trait_type": "POI数量", 
                "value": "4"
              },
              {
                "trait_type": "NFT Token ID",
                "value": "1001"
              },
              {
                "trait_type": "铸造时间",
                "value": "2025-01-15"
              }
            ]
          }
        }
      }),

      // 第三条：pending状态的凭证
      prisma.voucher.create({
        data: {
          id: 'voucher_3',
          userId: adminUser.id,
          routeId: 'route_1',
          status: 'pending',
          nftTokenId: "3",
          mintTxHash: null,
          metadata: {
            name: "箭塔村创业探索凭证 #3",
            description: "完成箭塔村创业探索路线的数字凭证",
            image: "https://arrowtower.netlify.app/pic/img_22.svg",
            external_url: "https://arrowtower.netlify.app/api/voucher/2",
            background_color: "4A90E2",
            attributes: [
              {
                "trait_type": "路线名称",
                "value": "箭塔村创业探索"
              },
              {
                "trait_type": "状态",
                "value": "待铸造"
              },
              {
                "trait_type": "难度等级",
                "value": "中等"
              }
            ]
          }
        }
      }),

      // 第四条：minted状态的凭证
      prisma.voucher.create({
        data: {
          id: 'voucher_4',
          userId: adminUser.id,
          routeId: 'route_2',
          status: 'minted',
          nftTokenId: '4',
          mintTxHash: '0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4',
          metadata: {
            name: "箭塔村文化历史凭证 #4",
            description: "成功完成箭塔村文化历史探索的NFT纪念凭证",
            image: "https://arrowtower.netlify.app/pic/img_15.svg",
            external_url: "https://arrowtower.netlify.app/api/voucher/1002",
            background_color: "4AE24A",
            attributes: [
              {
                "trait_type": "路线名称",
                "value": "箭塔村文化历史"
              },
              {
                "trait_type": "状态",
                "value": "已铸造"
              },
              {
                "trait_type": "NFT Token ID",
                "value": "1002"
              },
              {
                "trait_type": "完成度",
                "value": "100%"
              }
            ]
          }
        }
      }),

      // 第五条：failed状态的凭证
      prisma.voucher.create({
        data: {
          id: 'voucher_5',
          userId: adminUser.id,
          routeId: 'route_1',
          status: 'failed',
          nftTokenId: "5",
          mintTxHash: null,
          metadata: {
            name: "箭塔村创业探索凭证 #5",
            description: "箭塔村创业探索路线凭证（铸造失败）",
            image: "https://arrowtower.netlify.app/pic/img_8.svg",
            external_url: "https://arrowtower.netlify.app/api/voucher/3",
            background_color: "E2E24A",
            attributes: [
              {
                "trait_type": "路线名称",
                "value": "箭塔村创业探索"
              },
              {
                "trait_type": "状态",
                "value": "铸造失败"
              },
              {
                "trait_type": "错误信息",
                "value": "Gas费用不足"
              }
            ]
          }
        }
      }),

      // 第六条：minted状态的凭证
      prisma.voucher.create({
        data: {
          id: 'voucher_6',
          userId: adminUser.id,
          routeId: 'route_2',
          status: 'minted',
          nftTokenId: '6',
          mintTxHash: '0x123abc456def123abc456def123abc456def123abc456def123abc456def123a',
          metadata: {
            name: "箭塔村文化历史凭证 #6",
            description: "成功完成箭塔村文化历史探索的NFT纪念凭证",
            image: "https://arrowtower.netlify.app/pic/img_18.svg",
            external_url: "https://arrowtower.netlify.app/api/voucher/1003",
            background_color: "E24AE2",
            attributes: [
              {
                "trait_type": "路线名称",
                "value": "箭塔村文化历史"
              },
              {
                "trait_type": "状态",
                "value": "已铸造"
              },
              {
                "trait_type": "NFT Token ID",
                "value": "1003"
              },
              {
                "trait_type": "探索评分",
                "value": "95"
              },
              {
                "trait_type": "稀有度",
                "value": "稀有"
              }
            ]
          }
        }
      })
    ])

    console.log('✅ Voucher 创建完成，共创建', vouchers.length, '条凭证记录')
    
    // 打印创建的凭证状态统计
    const statusCount = {
      pending: vouchers.filter(v => v.status === 'pending').length,
      minted: vouchers.filter(v => v.status === 'minted').length,
      failed: vouchers.filter(v => v.status === 'failed').length
    }
    console.log(`📊 Voucher 状态统计: 待处理 ${statusCount.pending} 条, 已铸造 ${statusCount.minted} 条, 失败 ${statusCount.failed} 条`)
  } else {
    console.log(`📊 Voucher 表已有 ${voucherCount} 条数据，跳过初始化`)
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