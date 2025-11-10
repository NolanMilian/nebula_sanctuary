import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

import "./tasks/accounts";

const MNEMONIC =
  process.env.MNEMONIC ??
  vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? vars.get("SEPOLIA_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com");
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? vars.get("ETHERSCAN_API_KEY", "");
const RAW_PK = process.env.PRIVATE_KEY ?? vars.get("PRIVATE_KEY", "");
const PRIVATE_KEY = RAW_PK ? (RAW_PK.startsWith("0x") ? RAW_PK : `0x${RAW_PK}`) : "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC
      },
      chainId: 31337
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts:
        PRIVATE_KEY && PRIVATE_KEY.length > 0
          ? [PRIVATE_KEY]
          : {
              mnemonic: MNEMONIC,
              path: "m/44'/60'/0'/0/",
              count: 10
            }
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test"
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800
      },
      metadata: {
        bytecodeHash: "none"
      },
      evmVersion: "cancun"
    }
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6"
  }
};

export default config;

