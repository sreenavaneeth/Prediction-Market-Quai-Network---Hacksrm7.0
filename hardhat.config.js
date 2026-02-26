require("@nomicfoundation/hardhat-ethers");
require("@quai/hardhat-deploy-metadata");

require("dotenv").config();

function toAccounts(privateKey) {
  if (!privateKey) return [];
  return [privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`];
}

module.exports = {
  defaultNetwork: "cyprus1",

  networks: {
    cyprus1: {
      url: process.env.RPC_URL,
      accounts: toAccounts(process.env.CYPRUS1_PK),
      chainId: Number(process.env.CHAIN_ID),
    },
    orchard: {
      url: "https://orchard.rpc.quai.network/cyprus1",
      chainId: 15000,
      accounts: toAccounts(process.env.ORCHARD_PK || process.env.CYPRUS1_PK),
    },
  },

  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      metadata: {
        bytecodeHash: "ipfs",
        useLiteralContent: true,
      },
    },
  },

  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
};
