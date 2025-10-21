import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"
import { config as dotenvConfig } from "dotenv" 
dotenvConfig() 


const PRIVATE_KEY_LOCAL = process.env.PRIVATE_KEY_LOCAL || ""
const PRIVATE_KEY_PA = process.env.PRIVATE_KEY_PA || ""

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    resolc: {
        compilerSource: "npm",
        settings: {
            optimizer: {
                enabled: true,
                parameters: 'z',
                fallbackOz: true,
                runs:200
                
            }
        },
    },
    networks: {
        hardhat: {
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: './bin/substrate-node',
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        localNode: {
        polkavm: true,
        url: `http://127.0.0.1:8545`,
        accounts:[PRIVATE_KEY_LOCAL]
      },
      passethub:{
        polkavm: true,
        url: `https://testnet-passet-hub-eth-rpc.polkadot.io`,
        accounts:[PRIVATE_KEY_PA]
      }
    },
}

export default config
