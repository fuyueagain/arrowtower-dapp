// chains/passetHub.ts

import { defineChain } from 'viem';

export const passetHub = defineChain({
  id: 420420422,
  name: 'Passet Hub Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Passet',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
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
});