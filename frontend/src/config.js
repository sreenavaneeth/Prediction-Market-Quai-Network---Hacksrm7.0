const chainIdFromEnv = Number(import.meta.env.VITE_CHAIN_ID || 15000);

export const APP_CONFIG = {
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0x004a89AB9FAA8991921Ef9DEf1817eFb7866e9D8',
  chainId: Number.isFinite(chainIdFromEnv) ? chainIdFromEnv : 15000,
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Quai Testnet',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://orchard.rpc.quai.network/cyprus1',
  explorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://quaiscan.io',
  currencySymbol: import.meta.env.VITE_CURRENCY_SYMBOL || 'QUAI',
};

export const CHAIN_HEX = `0x${APP_CONFIG.chainId.toString(16)}`;

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'string', name: '_question', type: 'string' },
      { internalType: 'uint256', name: '_deadline', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'OnlyOwner', type: 'error' },
  { inputs: [], name: 'MarketClosed', type: 'error' },
  { inputs: [], name: 'MarketNotResolved', type: 'error' },
  { inputs: [], name: 'MarketAlreadyResolved', type: 'error' },
  { inputs: [], name: 'NoRewardsToClaim', type: 'error' },
  { inputs: [], name: 'TransferFailed', type: 'error' },
  { inputs: [], name: 'DeadlineNotPassed', type: 'error' },
  { inputs: [], name: 'buyYes', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'buyNo', outputs: [], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'claimReward', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'bool', name: '_outcome', type: 'bool' }], name: 'resolveMarket', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'question', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'deadline', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'yesPool', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'noPool', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'resolved', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'outcome', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'yesBets', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'noBets', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'claimed', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserBet',
    outputs: [
      { internalType: 'uint256', name: 'yesBet', type: 'uint256' },
      { internalType: 'uint256', name: 'noBet', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
