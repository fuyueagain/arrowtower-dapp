import { createWalletClient, createPublicClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { defineChain } from 'viem'
import * as fs from 'fs'
import path from 'path'

// 定义 Polkadot Hub TestNet
const polkadotHubTestnet = defineChain({
  id: 420420422,
  name: 'Polkadot Hub TestNet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'PAS',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io/',
    },
  },
  testnet: true,
})

// 从环境变量获取私钥

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`
if (!PRIVATE_KEY) {
  throw new Error('请设置 PRIVATE_KEY 环境变量')
}

// 创建客户端
const walletClient = createWalletClient({
  chain: polkadotHubTestnet,
  transport: http()
})

const publicClient = createPublicClient({
  chain: polkadotHubTestnet,
  transport: http()
})

// 从部署账户
const account = privateKeyToAccount(PRIVATE_KEY)

// 读取合约 ABI 和字节码
function getContractArtifacts(contractName: string) {
  const artifactPath = path.join(__dirname, `../artifacts-pvm/contracts/${contractName}.sol/${contractName}.json`)
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
  return {
    abi: artifact.abi,
    bytecode: artifact.bytecode
  }
}

async function main() {
  console.log("=====================================")
  console.log("🚀 箭塔村 NFT 项目部署脚本")
  console.log("📱 网络: Polkadot Hub TestNet")
  console.log("=====================================")
  console.log("部署者地址:", account.address)
  
  // 获取余额
  const balance = await publicClient.getBalance({ address: account.address })
  console.log("部署者余额:", parseEther(balance.toString()), "PAS\n")

  // ========================================
  // 阶段 1: 独立部署 NFT 合约
  // ========================================
  console.log("=====================================")
  console.log("📦 阶段 1: 独立部署 ArrowTowerNFT 合约")
  console.log("=====================================")
  
  const nftName = "Arrow Tower Village NFT"
  const nftSymbol = "ATVNFT"
  const nftBaseURI = "https://arrowtower.netlify.app/metadata/"
  
  console.log("NFT 配置参数:")
  console.log(`   名称: ${nftName}`)
  console.log(`   符号: ${nftSymbol}`)
  console.log(`   基础URI: ${nftBaseURI}`)
  console.log("\n正在部署...")
  
  const nftArtifacts = getContractArtifacts("ArrowTowerNFT")
  
  const nftHash = await walletClient.deployContract({
    account,
    abi: nftArtifacts.abi,
    bytecode: nftArtifacts.bytecode as `0x${string}`,
    args: [nftName, nftSymbol, nftBaseURI]
  })
  
  // 等待交易确认
  const nftReceipt = await publicClient.waitForTransactionReceipt({ hash: nftHash })
  if (!nftReceipt.contractAddress) {
    throw new Error('NFT 合约部署失败')
  }
  
  const standaloneNFTAddr = nftReceipt.contractAddress
  console.log("✅ ArrowTowerNFT 部署成功")
  console.log("   交易哈希:", nftHash)
  console.log("   合约地址:", standaloneNFTAddr)
  console.log("   区块高度:", nftReceipt.blockNumber)
  console.log("   状态: 已初始化并可用\n")

  // 验证 NFT 基础信息
  const nftNameCheck = await publicClient.readContract({
    address: standaloneNFTAddr,
    abi: nftArtifacts.abi,
    functionName: 'name'
  })
  
  const nftSymbolCheck = await publicClient.readContract({
    address: standaloneNFTAddr,
    abi: nftArtifacts.abi,
    functionName: 'symbol'
  })
  
  const nftTotalSupply = await publicClient.readContract({
    address: standaloneNFTAddr,
    abi: nftArtifacts.abi,
    functionName: 'totalSupply'
  })
  
  console.log("NFT 合约验证:")
  console.log(`   名称匹配: ${nftNameCheck === nftName ? "✓" : "✗"}`)
  console.log(`   符号匹配: ${nftSymbolCheck === nftSymbol ? "✓" : "✗"}`)
  console.log(`   初始供应量: ${nftTotalSupply}\n`)

  // ========================================
  // 阶段 2: 独立部署 Minter 合约
  // ========================================
  console.log("=====================================")
  console.log("📦 阶段 2: 独立部署 ArrowTowerMinter 合约")
  console.log("=====================================")
  
  console.log("Minter 配置参数:")
  console.log(`   NFT 合约地址: ${standaloneNFTAddr}`)
  console.log("\n正在部署...")
  
  const minterArtifacts = getContractArtifacts("ArrowTowerMinter")
  
  const minterHash = await walletClient.deployContract({
    account,
    abi: minterArtifacts.abi,
    bytecode: minterArtifacts.bytecode as `0x${string}`,
    args: [standaloneNFTAddr]
  })
  
  // 等待交易确认
  const minterReceipt = await publicClient.waitForTransactionReceipt({ hash: minterHash })
  if (!minterReceipt.contractAddress) {
    throw new Error('Minter 合约部署失败')
  }
  
  const standaloneMinterAddr = minterReceipt.contractAddress
  console.log("✅ ArrowTowerMinter 部署成功")
  console.log("   交易哈希:", minterHash)
  console.log("   合约地址:", standaloneMinterAddr)
  console.log("   区块高度:", minterReceipt.blockNumber)
  console.log("   状态: 已初始化并可用\n")

  // 验证 Minter 基础信息
  const minterNFTAddr = await publicClient.readContract({
    address: standaloneMinterAddr,
    abi: minterArtifacts.abi,
    functionName: 'nftContract'
  })
  
  const minterPaused = await publicClient.readContract({
    address: standaloneMinterAddr,
    abi: minterArtifacts.abi,
    functionName: 'paused'
  })
  
  const minterOwner = await publicClient.readContract({
    address: standaloneMinterAddr,
    abi: minterArtifacts.abi,
    functionName: 'owner'
  })
  
  console.log("Minter 合约验证:")
  console.log(`   NFT 地址匹配: ${minterNFTAddr === standaloneNFTAddr ? "✓" : "✗"}`)
  console.log(`   暂停状态: ${minterPaused}`)
  console.log(`   所有者: ${minterOwner}\n`)

  // ========================================
  // 阶段 3: 绑定 NFT 和 Minter 合约
  // ========================================
  console.log("=====================================")
  console.log("🔗 阶段 3: 绑定 NFT 和 Minter 合约")
  console.log("=====================================\n")
  
  console.log("设置 Minter 为 NFT 的授权铸造者...")
  
  const setMinterHash = await walletClient.writeContract({
    account,
    address: standaloneNFTAddr,
    abi: nftArtifacts.abi,
    functionName: 'setMinterContract',
    args: [standaloneMinterAddr]
  })
  
  await publicClient.waitForTransactionReceipt({ hash: setMinterHash })
  
  const currentMinter = await publicClient.readContract({
    address: standaloneNFTAddr,
    abi: nftArtifacts.abi,
    functionName: 'minterContract'
  })
  
  console.log("✅ Minter 绑定成功")
  console.log(`   交易哈希: ${setMinterHash}`)
  console.log(`   当前 Minter: ${currentMinter}`)
  console.log(`   绑定验证: ${currentMinter === standaloneMinterAddr ? "✓" : "✗"}\n`)

  // ========================================
  // 部署信息汇总
  // ========================================
  console.log("=====================================")
  console.log("📋 部署信息汇总")
  console.log("=====================================")
  console.log(`网络: ${polkadotHubTestnet.name}`)
  console.log(`链ID: ${polkadotHubTestnet.id}`)
  console.log(`NFT 合约地址: ${standaloneNFTAddr}`)
  console.log(`Minter 合约地址: ${standaloneMinterAddr}`)
  console.log(`部署者地址: ${account.address}`)
  console.log(`区块浏览器: ${polkadotHubTestnet.blockExplorers.default.url}`)
  console.log("=====================================\n")

  // 保存部署信息到文件
  const deploymentInfo = {
    network: polkadotHubTestnet.name,
    chainId: polkadotHubTestnet.id,
    nftContract: standaloneNFTAddr,
    minterContract: standaloneMinterAddr,
    deployer: account.address,
    deploymentTime: new Date().toISOString(),
    blockExplorer: polkadotHubTestnet.blockExplorers.default.url,
    transactions: {
      nftDeployment: nftHash,
      minterDeployment: minterHash,
      setMinter: setMinterHash
    }
  }
  
  fs.writeFileSync(
    path.join(__dirname, '../deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  )
  
  console.log("📄 部署信息已保存到 deployment-info.json")
  
  // 提供区块浏览器链接
  console.log("🔍 区块浏览器链接:")
  console.log(`   NFT 部署交易: ${polkadotHubTestnet.blockExplorers.default.url}/tx/${nftHash}`)
  console.log(`   Minter 部署交易: ${polkadotHubTestnet.blockExplorers.default.url}/tx/${minterHash}`)
  console.log(`   Minter 绑定交易: ${polkadotHubTestnet.blockExplorers.default.url}/tx/${setMinterHash}`)
  console.log(`   NFT 合约: ${polkadotHubTestnet.blockExplorers.default.url}/address/${standaloneNFTAddr}`)
  console.log(`   Minter 合约: ${polkadotHubTestnet.blockExplorers.default.url}/address/${standaloneMinterAddr}`)
}

main().catch((error) => {
  console.error("部署发生错误:", error)
  process.exit(1)
})