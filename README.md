# ArrowTower

![Snapshot](./pic/Snapshot.PNG)
## 📖 项目简介

ArrowTower 是一个基于 Polkadot 生态的地理位置打卡平台，通过**零 Gas 费**后端代铸造技术，让用户无门槛体验 Web3。首期聚焦箭塔村乡村旅游场景，游客完成特色路线打卡和互动任务后，系统自动发放独特 NFT 数字纪念品，无需用户了解Gas费或支付费用，学习钱包使用与签名。

平台可快速拓展至 **Web3 会展活动**、**城市文旅探索**、**教育研学**、**商业营销**、**公益活动** 等多个商业场景。通过链上身份验证和可验证数字凭证，为文旅、会展、教育、营销等行业提供创新的用户互动和数字资产解决方案。

**🌐 演示网站**：https://arrowtower.netlify.app/

## ✨ 核心特性

- **🎁 零 Gas 费体验**：基于 PolkaVM 的后端代铸造技术，用户无需支付任何 Gas 费用
- **🚀 零门槛接入**：用户仅需简单钱包签名操作，系统自动发放 NFT
- **📍 地理位置验证**：支持 GPS 定位和二维码扫描双重验证
- **🎨 互动任务系统**：拍照上传、知识问答、文化体验等多样化任务
- **🏆 成就与 NFT**：完成路线自动铸造独特数字纪念品
- **🔗 链上可验证**：所有记录上链，可追溯、可验证、不可篡改
- **⚡ PolkaVM 驱动**：基于 Polkadot Hub Testnet，享受高性能低成本优势

## 🎯 应用场景

### 首期场景：箭塔村乡村旅游

游客通过 dApp 浏览箭塔村特色旅游路线，到达指定地点后通过地理位置校验或扫描二维码完成打卡，完成互动任务（拍照上传、知识问答、文化体验）积累成就。完成完整路线后系统自动铸造并发送独特的箭塔村 NFT 数字纪念品到用户钱包（无需用户操作）。

**价值**：提升游客游览趣味性和参与度，为箭塔村建立数字化旅游品牌，通过 NFT 实现长期用户连接和二次传播。

### 拓展场景

**🎪 Web3 会展活动**
- 会议签到打卡、展位互动、演讲厅打卡、社交网络打卡
- 根据打卡完成度自动发放不同等级的参会证明 NFT
- 链上身份验证确保参会者身份真实性，防止代签到
- 实时数据统计，为主办方和展商提供可量化的效果数据
- 适用于区块链峰会、Web3 黑客松、行业展览会、开发者大会等

**🏙️ 城市文旅探索**
- 历史文化线路、美食探店路线、艺术文化路线、城市挑战赛
- 促进文旅消费和城市品牌传播，建立城市数字文化资产

**📚 教育与研学**
- 校园定向越野、研学旅行记录、实践课程打卡、毕业纪念册
- 增强学习趣味性，建立链上教育档案，提供可验证的课外活动证明

**🛍️ 商业营销活动**
- 品牌联动打卡、新品发布会、会员体系升级、线下快闪活动
- 提升用户到店率和互动率，打造品牌数字资产和 Web3 社区基础

**🤝 社区与公益活动**
- 志愿服务记录、环保行动打卡、社区活动参与、慈善捐赠记录
- 建立可信的公益记录体系，提升公益活动透明度和公信力

## 🛠️ 技术架构

### 技术栈

**前端**
- **框架**：Next.js 15+ (App Router)
- **样式**：Tailwind CSS + shadcn/ui
- **区块链交互**：wagmi + viem
- **认证系统**：NextAuth.js
- **状态管理**：React Hooks

**后端**
- **API 层**：Next.js API Routes
- **数据库 ORM**：Prisma
- **NFT 铸造**：后端代铸造（Zero Gas Fee）

**区块链**
- **虚拟机**：PolkaVM
- **测试网络**：Polkadot Hub Testnet
- **智能合约**：
  - Minter 合约：`0x079098fb8e901DE45AB510fA669bdE793DfEBD50`
  - NFT 合约：`0x9373197B94f4633FBc121532F3cF3948FD4a5a15`

![Snapshot](./pic/Snapshot2.PNG)

### 系统架构

```
┌─────────────────────────────────────────┐
│         用户界面层 (Next.js)             │
│    React + Tailwind CSS + shadcn/ui     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        区块链交互层 (wagmi + viem)       │
│         用户钱包连接与交易签名            │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│    业务逻辑层 (API Routes + NextAuth)   │
│      地理位置验证 | 任务管理 | 数据统计    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      数据持久层 (Prisma + Database)      │
│      用户数据 | 打卡记录 | 任务进度        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│       区块链层 (PolkaVM + Testnet)       │
│  Polkadot Hub Testnet | Smart Contracts │
└─────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 20.x 或更高版本
- 数据库（PostgreSQL / MySQL / SQLite）

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/easyshellworld/arrowtower-dapp.git
cd arrowtower-dapp
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env.local` 文件并配置必要的环境变量：

```env
# 数据库配置
DATABASE_URL="your_database_url"

# NextAuth 配置
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Polkadot Hub Testnet 配置
NEXT_PUBLIC_CHAIN_ID="polkadot-hub-testnet"
NEXT_PUBLIC_RPC_URL="your_rpc_url"

# 智能合约地址
NEXT_PUBLIC_MINTER_CONTRACT="0x079098fb8e901DE45AB510fA669bdE793DfEBD50"
NEXT_PUBLIC_NFT_CONTRACT="0x9373197B94f4633FBc121532F3cF3948FD4a5a15"

# 后端铸造私钥（仅服务端）
MINTER_PRIVATE_KEY="your_private_key"
```

4. **初始化数据库**

```bash
npm run init:db
```

5. **启动开发服务器**

```bash
npm run dev
```

6. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📦 项目结构

```
arrowtower-dapp/
├── contracts/                 # 智能合约 (Hardhat 项目)
│   └── hardhat-arrowtower/
│       ├── contracts/         # Solidity 源码（arrow_tower_minter.sol, arrow_tower_nft.sol, ...）
│       ├── scripts/           # 部署 / 测试脚本
│       ├── test/              # 智能合约测试
│       ├── artifacts-pvm/     # 编译产物
│       └── typechain-types/   # TypeChain 类型
├── prisma/                    # Prisma ORM（schema / migrations / client）
│   └── (schema.prisma / migrations / client)
├── src/                       # 应用源码（已从 log 中识别）
│   ├── app/                   # Next.js App Router 源码（页面与 API 路由）
│   │   ├── admin/             # 管理后台页面
│   │   ├── api/               # API 路由（server-only）
│   │   │   ├── admin/
│   │   │   │   └─checkins/    # 管理相关接口
│   │   │   ├── auth/
│   │   │   │   ├─signin/
│   │   │   │   └─[...nextauth]/
│   │   │   ├── checkins/
│   │   │   ├── checkmint/
│   │   │   ├── health/
│   │   │   ├── metadata/
│   │   │   │   └─[id]/
│   │   │   ├── pois/
│   │   │   ├── route_list/
│   │   │   └── upload/
│   │   │       └─photo/
│   │   ├── maps/              # 地图相关页面
│   │   ├── routes/            # 动态路由页面
│   │   │   └─[id]/
│   │   ├── testcheckin/
│   │   └── user/
│   │       ├─checkmint/
│   │       └─[poi]/
│   ├── components/            # 可复用组件
│   │   ├─maps/                # 地图组件
│   │   └─ui/
│   ├── jobs/                  # 批处理 / 后台任务（cron / jobs）
│   └── lib/                   # 项目内部工具库
│       ├─chains/              # 链配置
│       └─db/                  # 数据库封装（Prisma client）
├── public/                    # 静态资源（web 可直取）
│   └── pic/
│       └── svg_small/         # 小尺寸 svg 资源
├── pic/                       # 设计/示例图（log 中出现的单独目录）
│   ├─svg/
│   └─svg_small/
├── scripts/                   # 项目脚本（部署、工具脚本）
├── data/                      # 示例数据 / 种子数据 / 导出
├── doc/                       # 项目文档（release notes / design doc）
├── tests/                     # 端到端或集成测试目录
├── .env.example               # 环境变量示例（请确保敏感信息不在 repo）
├── README.md                  # 项目说明
└── (配置文件)
    ├─tsconfig.json
    ├─next.config.js / next.config.ts
    ├─tailwind.config.js
    ├─postcss.config.js
    └─components.json          # shadcn/ui 配置


```

## 🔑 核心功能模块

### 1. 用户认证模块
- 钱包连接（基于 wagmi）
- 签名验证
- 会话管理（NextAuth）

### 2. 地理位置打卡模块
- GPS 定位验证
- 二维码扫描
- 打卡记录上链

### 3. 任务系统模块
- 任务创建与管理
- 进度跟踪
- 成就系统

### 4. NFT 铸造模块
- 后端代铸造（零 Gas 费）
- 基于 PolkaVM 的高性能铸造
- NFT 分发与管理

### 5. 数据统计模块
- 实时数据看板
- 用户行为分析
- 活动效果统计

## 🎨 设计理念

- **用户体验优先**：简化 Web3 操作流程，让普通用户也能轻松使用
- **零门槛接入**：无需了解区块链知识，系统自动处理所有复杂操作
- **场景化设计**：针对不同应用场景提供定制化解决方案
- **可扩展架构**：模块化设计，易于扩展新功能和新场景
- **PolkaVM 优势**：充分利用 Polkadot 生态的互操作性和低成本优势

## 🔧 NPM 脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run init:db      # 初始化数据库
```

## 🌐 部署

### Netlify 部署（推荐）

1. Fork 本项目到你的 GitHub 账户
2. 在 Netlify 中导入项目
3. 配置环境变量
4. 点击部署

项目已部署演示：https://arrowtower.netlify.app/



## 🤝 贡献指南

我们欢迎所有形式的贡献，包括但不限于：

- 🐛 提交 Bug 报告
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🌐 翻译文档

## 📄 开源协议

本项目采用 MIT 协议开源。

## 📞 联系方式

- **项目主页**：https://github.com/easyshellworld/arrowtower-dapp
- **演示网站**：https://arrowtower.netlify.app/
- **问题反馈**：https://github.com/easyshellworld/arrowtower-dapp/issues
- **文档中心**：[doc/1.3beta.md](doc/1.3beta.md)

## 🌟 致谢

感谢所有为本项目做出贡献的开发者和社区成员！

特别感谢 Polkadot 生态对 Web3 基础设施的支持。

---

**ArrowTower** - 让每一次探索都成为永恒的数字记忆 🗼✨