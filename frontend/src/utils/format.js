import { ethers } from 'ethers';
import { APP_CONFIG } from '../config';

export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatToken(weiValue, digits = 4) {
  if (weiValue === null || weiValue === undefined) return '0';
  try {
    const raw = Number(ethers.formatEther(weiValue));
    if (!Number.isFinite(raw)) return '0';
    return raw.toFixed(digits);
  } catch {
    return '0';
  }
}

export function parseTokenInput(value) {
  if (!value || Number(value) <= 0) return null;
  try {
    return ethers.parseEther(value);
  } catch {
    return null;
  }
}

export function percent(part, total) {
  if (total <= 0) return 50;
  return (part / total) * 100;
}

export function calcPools(yesPool, noPool) {
  const yes = Number(ethers.formatEther(yesPool || 0n));
  const no = Number(ethers.formatEther(noPool || 0n));
  const total = yes + no;
  return {
    yes,
    no,
    total,
    yesPct: percent(yes, total),
    noPct: percent(no, total),
  };
}

export function calcPayoutPreview(betWei, sidePoolWei, totalPoolWei) {
  if (!betWei || betWei <= 0n) return '0.0000';
  if (!sidePoolWei || sidePoolWei <= 0n) {
    return formatToken(betWei, 4);
  }
  try {
    const payout = (betWei * totalPoolWei) / sidePoolWei;
    return formatToken(payout, 4);
  } catch {
    return '0.0000';
  }
}

export function calcImpliedMultiplier(sidePoolWei, totalPoolWei) {
  if (!totalPoolWei || totalPoolWei <= 0n) return '1.00x';
  if (!sidePoolWei || sidePoolWei <= 0n) return '--';

  try {
    const total = Number(ethers.formatEther(totalPoolWei));
    const side = Number(ethers.formatEther(sidePoolWei));
    if (side <= 0) return '--';
    return `${(total / side).toFixed(2)}x`;
  } catch {
    return '--';
  }
}

export function getMarketStatus(market) {
  if (!market) return 'loading';
  if (market.resolved) return 'resolved';

  const deadlineNum = Number(market.deadline || 0n);
  const now = Math.floor(Date.now() / 1000);
  if (deadlineNum > now) return 'open';
  return 'awaiting_resolution';
}

export function formatStatus(status) {
  if (status === 'open') return 'Open';
  if (status === 'awaiting_resolution') return 'Awaiting Resolution';
  if (status === 'resolved') return 'Resolved';
  return 'Loading';
}

export function formatCountdown(deadline) {
  const deadlineNum = Number(deadline || 0n);
  const now = Math.floor(Date.now() / 1000);
  const diff = deadlineNum - now;

  if (diff <= 0) return 'Deadline passed';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatDateTime(unixTimestamp) {
  if (!unixTimestamp) return 'N/A';
  const date = new Date(Number(unixTimestamp) * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function explorerTxUrl(txHash) {
  return `${APP_CONFIG.explorerUrl.replace(/\/$/, '')}/tx/${txHash}`;
}

export function explorerAddressUrl(address) {
  return `${APP_CONFIG.explorerUrl.replace(/\/$/, '')}/address/${address}`;
}

export function parseContractError(error) {
  const message = String(error?.shortMessage || error?.reason || error?.message || '');
  const lowered = message.toLowerCase();

  if (lowered.includes('marketclosed')) return 'Market is closed for new bets.';
  if (lowered.includes('deadlinenotpassed')) return 'Deadline not passed yet. Resolve after deadline.';
  if (lowered.includes('onlyowner')) return 'Only market owner can perform this action.';
  if (lowered.includes('marketalreadyresolved')) return 'Market is already resolved.';
  if (lowered.includes('norewardstoclaim')) return 'No reward available for this wallet.';
  if (lowered.includes('marketnotresolved')) return 'Market is not resolved yet.';
  if (lowered.includes('insufficient funds')) return 'Insufficient balance for this transaction.';
  if (lowered.includes('user rejected') || lowered.includes('rejected')) return 'User rejected request.';
  if (lowered.includes('wrong network') || lowered.includes('chain')) return 'Wrong network selected.';
  if (lowered.includes('request already pending') || lowered.includes('-32002')) {
    return 'Wallet request already pending. Check your wallet extension.';
  }
  if (lowered.includes('estimate') && lowered.includes('gas')) {
    return 'Gas estimation failed. Ensure wallet is on the right chain and has test tokens.';
  }
  if (lowered.includes('method not found') || lowered.includes('unsupported')) {
    return 'Wallet RPC method unsupported. Update Pelagus and retry.';
  }
  if (lowered.includes('nonce too low')) {
    return 'Nonce conflict detected. Wait for pending tx to confirm and retry.';
  }
  if (lowered.includes('failed to fetch') || lowered.includes('network error')) {
    return 'RPC unreachable. Ensure VITE_RPC_URL points to a valid endpoint (for Orchard use /cyprus1).';
  }

  return message || 'Transaction failed.';
}
