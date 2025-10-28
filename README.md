# ArrowTower

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/easyshellworld/arrowtower-dapp/blob/main/LICENSE)[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/easyshellworld/arrowtower-dapp/pulls)[![GitHub Repo stars](https://img.shields.io/github/stars/easyshellworld/arrowtower-dapp?style=social)](https://github.com/easyshellworld/arrowtower-dapp/stargazers)[![Open Issues](https://img.shields.io/github/issues/easyshellworld/arrowtower-dapp)](https://github.com/easyshellworld/arrowtower-dapp/issues)[![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/easyshellworld/arrowtower-dapp)](https://github.com/easyshellworld/arrowtower-dapp/pulls?q=is%3Apr+is%3Aclosed)[![Last Commit](https://img.shields.io/github/last-commit/easyshellworld/arrowtower-dapp)](https://github.com/easyshellworld/arrowtower-dapp/commits/main)

[![Polkadot](https://img.shields.io/badge/Polkadot-Hub_Testnet-E6007A?logo=polkadot)](https://polkadot.network/)[![Solidity](https://img.shields.io/badge/Solidity-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)[![Web3](https://img.shields.io/badge/Web3-wagmi%2Bviem-FF6B35?logo=ethereum)](https://wagmi.sh/)[![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?logo=hardhat&logoColor=black)](https://hardhat.org/)

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://arrowtower.netlify.app/)[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions)](https://github.com/easyshellworld/arrowtower-dapp/actions)[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/easyshellworld/arrowtower-dapp/actions)[![Docker Ready](https://img.shields.io/badge/docker-ready-blue?logo=docker)](https://hub.docker.com/)


## 📖 Project Overview

ArrowTower is a geo-location check-in dApp built in the Polkadot ecosystem. One-click deployment and multi-scenario applicability are supported. Gasless minting is achieved via backend-sponsored transactions, enabling barrier-free Web3 onboarding. The first application scenario is Arrow Tower Village (rural tourism). After a user completes route check-ins and interactive tasks, an NFT digital souvenir is minted and delivered automatically, without requiring the user to manage gas, fees, wallets, or signatures.

![Snapshot](./public/ppt/snapshot.png)

The platform is designed for rapid extension to **Web3 conferences & events**, **urban cultural tourism**, **education & field trips**, **commercial marketing**, **community & public welfare**, and additional business scenarios. On-chain identity and verifiable credentials are leveraged to provide robust user interaction and digital asset solutions across these sectors.

* **🌐 Live Demo**: https://arrowtower.netlify.app/
* **🎬 Demo Video**: [ArrowTower_DEMO](https://www.youtube.com/watch?v=Yy2VQyNbHfQ)
* **📖 Business Feasibility Study (Entertainment Edition)**: [Business_Feasibility_Study(Entertainment_Edition).md](./docs/Business_Feasibility_Study(Entertainment_Edition).md)


## ✨ Core Features

- **🎁 Gasless User Experience**: Backend-sponsored minting on PolkaVM; users do not pay gas.
- **🚀 Instant Deployment**: Fork or clone, start Docker, and access the system immediately.
- **🔧 Multiple Deployment Options**: Docker, Kubernetes, and GitHub Actions for one-click CI/CD.
- **🔄 Queue Minting**: Transaction queues and batch NFT minting to handle high concurrency.
- **🖥️ Frontend-Driven Contract Ops**: Configure and switch NFT contracts via the admin UI without backend changes.
- **📍 Geo + QR Validation**: GPS verification and QR scanning ensure check-in validity.
- **🎨 Interactive Tasks**: Photo upload, quizzes, route check-ins, and achievement unlocks.
- **📊 Analytics Dashboard**: Real-time metrics for user behavior, task progress, mint volume, and participation.
- **🧩 Modular Components**: Check-ins, tasks, NFT, and analytics modules are reusable.
- **⚡ PolkaVM Testnet**: Runs on Polkadot Hub testnet, offering high performance at low cost.


## 🔑 Core Functional Modules

1. **Authentication**
   - Wallet connection
   - Signature-based authentication and session management (NextAuth)
2. **Check-ins**
   - GPS verification
   - QR code scanning
   - Check-in records synchronized on-chain
3. **Tasks**
   - Create or edit task routes (photo upload, quizzes, check-ins)
   - Reward triggers for automatic NFT minting upon completion
4. **Minting**
   - Backend-sponsored minting; supports batch queue minting
   - Contract address/ABI configured from the frontend admin panel
   - On-chain mint records; NFTs delivered to user wallets
5. **Analytics**
   - Real-time metrics for check-ins, completion, mint volume, activity, and participation
   - Combined views of on-chain data and local database data
   - Chart dashboards for operational analysis
6. **Ops & Deployment**
   - Dockerfile and docker-compose for one-click startup
   - GitHub Actions/GitLab CI build and deployment pipelines
   - Network switching (local, testnet, mainnet) and DB options (PostgreSQL/SQLite)

## 🎯 Application Scenarios

### First Application Scenario: Arrow Tower Village (Rural Tourism)

Tourists browse Arrow Tower Village's featured tourism routes through the dApp. Upon reaching designated locations, they complete check-ins through geo-location verification or QR code scanning, and complete interactive tasks (photo uploads, knowledge quizzes, cultural experiences) to accumulate achievements. After completing the full route, the system automatically mints and sends unique Arrow Tower Village NFT digital souvenirs to the user's wallet (without user operation required).

**Value**: Tourist engagement is increased, a digital tourism brand is established, and long-term user connection and secondary dissemination are enabled via NFTs.

### Expansion Scenarios

**🎪 Web3 Conference & Events**
- Conference sign-in check-ins, booth interactions, lecture hall check-ins, social network check-ins
- Automatically distribute different levels of conference attendance certificate NFTs based on check-in completion
- On-chain identity verification ensures attendee authenticity and prevents proxy sign-ins
- Real-time data statistics provide quantifiable effectiveness data for organizers and exhibitors
- Applicable to blockchain summits, Web3 hackathons, industry exhibitions, developer conferences, etc.

**🏙️ Urban Cultural Tourism**
- Historical and cultural routes, food exploration routes, art and culture routes, city challenges
- Promotes cultural tourism consumption and city brand communication, establishes digital cultural assets for cities

**📚 Education & Field Trips**
- Campus orienteering, field trip records, practical course check-ins, graduation memoirs
- Enhances learning interest, establishes on-chain educational archives, provides verifiable extracurricular activity certificates

**🛍️ Commercial Marketing Activities**
- Brand collaboration check-ins, new product launches, membership system upgrades, offline pop-up events
- Increases user store visit rates and interaction rates, creates brand digital assets and Web3 community foundation

**🤝 Community & Public Welfare Activities**
- Volunteer service records, environmental action check-ins, community activity participation, charity donation records
- Establishes a trustworthy public welfare record system, enhances transparency and credibility of public welfare activities

## 🛠️ Technical Architecture

### Tech Stack

**Frontend**
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Blockchain Interaction**: wagmi + viem
- **Authentication**: NextAuth.js
- **State Management**: React Hooks

**Backend**
- **API Layer**: Next.js API Routes
- **Database ORM**: Prisma
- **NFT Minting**: Backend proxy minting (Zero Gas Fee)

**Blockchain**
- **Virtual Machine**: PolkaVM
- **Test Network**: Polkadot Hub Testnet
- **Smart Contracts**:
  - Minter Contract: `0x079098fb8e901DE45AB510fA669bdE793DfEBD50` *(View on blockchain explorer: [Blockscout](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x079098fb8e901DE45AB510fA669bdE793DfEBD50))*
  - NFT Contract: `0x9373197B94f4633FBc121532F3cF3948FD4a5a15` *(View on blockchain explorer: [Blockscout](https://blockscout-passet-hub.parity-testnet.parity.io/token/0x9373197B94f4633FBc121532F3cF3948FD4a5a15))*

![Snapshot](./pic/Snapshot2.PNG)

### System Architecture

```
┌─────────────────────────────────────────┐
│      User Interface Layer (Next.js)     │
│    React + Tailwind CSS + shadcn/ui     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Blockchain Interaction (wagmi + viem) │
│    User Wallet Connection & TX Signing  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│  Business Logic (API Routes + NextAuth) │
│ Geo Verification | Task Mgmt | Analytics│
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Data Persistence (Prisma + Database)  │
│   User Data | Check-in Records | Tasks  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│    Blockchain Layer (PolkaVM + Testnet) │
│  Polkadot Hub Testnet | Smart Contracts │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Requirements

- Node.js 20.x or higher
- Database (PostgreSQL / MySQL / SQLite)

### Installation Steps

#### 1. Clone the Project

```bash
git clone https://github.com/easyshellworld/arrowtower-dapp.git
cd arrowtower-dapp
```

#### 2. Smart Contract Deployment & Testing

**2.1 Enter Contract Directory and Install Dependencies**

```bash
cd contracts/hardhat-arrowtower
npm install
```

**2.2 Configure Contract Environment Variables**

Create `.env` file and configure the following:

```env
# Local network private key example
PRIVATE_KEY_LOCAL="0x...."

# passethub (testnet) private key
PRIVATE_KEY_PA="0x...."
```

**2.3 Deploy & Test Contracts**

```bash
# Local network deployment & testing
npx hardhat run scripts/deploy.ts --network localNode
npx hardhat run scripts/deployandtest.ts --network localNode

# Deploy & test using passet-hub testnet
npx hardhat run scripts/deploy.ts --network passethub
npx hardhat run scripts/deployandtest.ts --network passethub
```

**2.4 Return to Project Root Directory**

```bash
cd ../..
```

#### 3. dApp Installation & Configuration

**3.1 Install Dependencies**

```bash
npm install
```

**3.2 Configure Application Environment Variables**

Create `.env` file and configure the following:

```env
# Database configuration
DATABASE_URL="your_database_url"

# NextAuth configuration
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Configure website base URL
NEXT_PUBLIC_ARROW_TOWER_BASE_URL="https://arrowtower.netlify.app/"

# Smart contract addresses
NEXT_PUBLIC_MINTER_CONTRACT="0x079098fb8e901DE45AB510fA669bdE793DfEBD50"
NEXT_PUBLIC_NFT_CONTRACT="0x9373197B94f4633FBc121532F3cF3948FD4a5a15"

# Backend minting private key (server-side only)
PRIVATE_KEY="your_private_key"

# Initialization
ADMIN_ADDRESS="admin wallet address"
```

**3.3 Initialize Database**

```bash
npx prisma generate
npx prisma db push
npm run init:db
```

**3.4 Start Development Server**

```bash
npm run dev
```

**3.5 Access Application**

Open your browser and visit [http://localhost:3000](http://localhost:3000)


## 🐳 Docker One-Click Deployment

Using Docker Compose, you can quickly start a complete production-grade ArrowTower application stack, including PostgreSQL database and Next.js application.

### 1. Clone Project

```bash
git clone https://github.com/easyshellworld/arrowtower-dapp.git
cd arrowtower-dapp
```

### 2. Configure Environment Variables

Create `.env` file and configure the following key parameters:

```env
# Database configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=arrowtower
DATABASE_URL="postgresql://postgres:your_secure_password@postgres:5432/arrowtower?schema=public"

# NextAuth configuration
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:30000"

# Website base configuration
NEXT_PUBLIC_ARROW_TOWER_BASE_URL="http://localhost:30000"

# Smart contract addresses
NEXT_PUBLIC_MINTER_CONTRACT="0x079098fb8e901DE45AB510fA669bdE793DfEBD50"
NEXT_PUBLIC_NFT_ADDRESS="0x9373197B94f4633FBc121532F3cF3948FD4a5a15"

# Blockchain configuration
PRIVATE_KEY="your_private_key_for_backend_minting"
CHAIN_ID="420420421"
RPC_URL="https://rpc.polkadot-hub-paseo-testnet.polkadot.io"
NETWORK="polkadot-hub-paseo-testnet"

# Initialization
ADMIN_ADDRESS="admin wallet address"
```

### 3. Start Services

Use Docker Compose to start all services with one command:

```bash
docker-compose up -d
```

This will automatically:
- Pull and start PostgreSQL 16 database
- Build and start Next.js application
- Configure network and data volumes
- Execute health checks

### 4. Verify Deployment

Check service status:

```bash
docker-compose ps
```

View application logs:

```bash
docker-compose logs -f app
```

Access application: Open your browser and visit [http://localhost:30000](http://localhost:30000)

## 📦 Project Structure

```
arrowtower-dapp/
├── contracts/                 # Smart contracts (Hardhat project)
│   └── hardhat-arrowtower/
│       ├── contracts/         # Solidity source code (arrow_tower_minter.sol, arrow_tower_nft.sol, ...)
│       ├── scripts/           # Deployment / testing scripts
│       ├── test/              # Smart contract tests
│       ├── artifacts-pvm/     # Compilation artifacts
│       └── typechain-types/   # TypeChain types
├── prisma/                    # Prisma ORM (schema / migrations / client)
│   └── (schema.prisma / migrations / client)
├── src/                       # Application source code
│   ├── app/                   # Next.js App Router source (pages & API routes)
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API routes (server-only)
│   │   │   ├── admin/
│   │   │   │   └─checkins/    # Admin-related APIs
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
│   │   ├── maps/              # Map-related pages
│   │   ├── routes/            # Dynamic route pages
│   │   │   └─[id]/
│   │   ├── testcheckin/
│   │   └── user/
│   │       ├─checkmint/
│   │       └─[poi]/
│   ├── components/            # Reusable components
│   │   ├─maps/                # Map components
│   │   └─ui/
│   ├── jobs/                  # Batch processing / background tasks (cron / jobs)
│   └── lib/                   # Internal utility libraries
│       ├─chains/              # Chain configuration
│       └─db/                  # Database wrapper (Prisma client)
├── public/                    # Static assets (web-accessible)
│   └── pic/
│       └── svg_small/         # Small-sized svg assets
├── pic/                       # Design/example images
│   ├─svg/
│   └─svg_small/
├── scripts/                   # Project scripts (deployment, utility scripts)
├── data/                      # Sample data / seed data / exports
├── doc/                       # Project documentation (release notes / design docs)
├── tests/                     # End-to-end or integration test directory
├── .env.example               # Environment variable example (ensure sensitive info not in repo)
├── README.md                  # Project documentation
└── (Configuration files)
    ├─tsconfig.json
    ├─next.config.js / next.config.ts
    ├─tailwind.config.js
    ├─postcss.config.js
    └─components.json          # shadcn/ui configuration
```

## 🌐 Deployment

### Netlify Deployment (Recommended)

1. Fork this project to your GitHub account
2. Import project in Netlify
3. Configure environment variables
4. Click deploy

Project demo deployment: https://arrowtower.netlify.app/

## 🤝 Contributing

We welcome all forms of contributions, including but not limited to:

- 🐛 Submit bug reports
- 💡 Propose new feature suggestions
- 📝 Improve documentation
- 🔧 Submit code fixes
- 🌐 Translate documentation

## 📄 License

This project is open source under the MIT License.

## 📞 Contact

- **Project Homepage**: https://github.com/easyshellworld/arrowtower-dapp
- **Live Demo**: https://arrowtower.netlify.app/
- **Issue Reporting**: https://github.com/easyshellworld/arrowtower-dapp/issues
- **Documentation**: 
   * [Early Project Plan (1.3beta)](docs/1.3beta.md)
   * [Business Feasibility Study (Entertainment Edition)](docs/Business_Feasibility_Study(Entertainment_Edition).md)


## 🌟 Acknowledgments

Thanks to all developers and community members who have contributed to this project!

Special thanks to the Polkadot ecosystem for supporting Web3 infrastructure.

---

**ArrowTower** - Make Every Exploration an Eternal Digital Memory 🗼✨