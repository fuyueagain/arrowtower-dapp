import { http, createConfig} from 'wagmi'
import { /* base, mainnet,optimism */Chain  } from 'wagmi/chains'
import { metaMask, walletConnect } from 'wagmi/connectors'

const projectId =process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID  || "Arrowtower" 
// 1. Asset‑Hub Westend Testnet 
const assetHubWestendTestnet: Chain = {
  id: 420420421,
  name: 'Asset‑Hub Westend Testnet',
  // network: 'asset-hub-westend-testnet',
  nativeCurrency: {
    name: 'Westend DOT',
    symbol: 'WND',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-asset-hub.parity-chains-scw.parity.io',
    },
    blockscout: {
      name: 'Blockscout',
      url: 'https://blockscout-asset-hub.parity-chains-scw.parity.io',
    },
  },
  testnet: true,
}


// 3. Polkadot Hub TestNet 
const polkadotHubTestnet: Chain = {
  id: 420420422,
  name: 'Polkadot Hub TestNet',
  // network: 'polkadot-hub-testnet',
  nativeCurrency: {
    name: 'Polkadot Asset Hub Token',
    symbol: 'PAS',
    decimals: 18,
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
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    },
  },
  testnet: true,
}


export const config = createConfig({
  // 两个测试网都加入 chains 数组
  chains: [/* assetHubWestendTestnet, */ polkadotHubTestnet], 
  connectors: [
  //  walletConnect({ projectId }),
    metaMask(),
  ],
  transports: {
    
   // [assetHubWestendTestnet.id]: http(),
    [polkadotHubTestnet.id]: http(),
  },
  ssr:true
})