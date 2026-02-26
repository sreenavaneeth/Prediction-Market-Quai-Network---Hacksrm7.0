// Contract configuration
// Replace with your deployed contract address
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x002fb2B8385B2e165e4351E613db705b6769fd60';

// Quai Network Chain IDs
export const CHAIN_IDS = {
  cyprus1: 715,
  cyprus2: 716,
  cyprus3: 717,
};

// Required chain ID for Cyprus1 testnet
export const REQUIRED_CHAIN_ID = CHAIN_IDS.cyprus1;

// RPC URLs
export const RPC_URLS = {
  cyprus1: 'https://cyprus1.rpc.quai.network',
  cyprus2: 'https://cyprus2.rpc.quai.network',
  cyprus3: 'https://cyprus3.rpc.quai.network',
};

// Explorer URL
export const EXPLORER_URL = 'https://cyprus1.quaiscan.io';

// ABI - Generated from contract
export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_question", "type": "string" },
      { "internalType": "uint256", "name": "_deadline", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "YesBought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "NoBought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }
    ],
    "name": "RewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "bool", "name": "outcome", "type": "bool" }
    ],
    "name": "MarketResolved",
    "type": "event"
  },
  { "inputs": [], "name": "buyYes", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "buyNo", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "claimReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getUserBet", "outputs": [
    { "internalType": "uint256", "name": "yesBet", "type": "uint256" },
    { "internalType": "uint256", "name": "noBet", "type": "uint256" }
  ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "question", "outputs": [{ "internalType": "string", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "deadline", "outputs": [{ "internalType": "uint256", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "yesPool", "outputs": [{ "internalType": "uint256", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "noPool", "outputs": [{ "internalType": "uint256", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "resolved", "outputs": [{ "internalType": "bool", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "outcome", "outputs": [{ "internalType": "bool", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "yesBets", "outputs": [{ "internalType": "uint256", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "noBets", "outputs": [{ "internalType": "uint256", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "claimed", "outputs": [{ "internalType": "bool", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "bool", "name": "_outcome", "type": "bool" }], "name": "resolveMarket", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];
