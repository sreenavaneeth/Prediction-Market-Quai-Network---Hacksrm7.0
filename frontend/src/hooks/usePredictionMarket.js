import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { APP_CONFIG, CONTRACT_ABI } from '../config';
import { getMarketStatus, parseContractError, parseTokenInput } from '../utils/format';

const EMPTY_MARKET = {
  question: '',
  deadline: 0n,
  yesPool: 0n,
  noPool: 0n,
  resolved: false,
  outcome: false,
  owner: '',
};

const EMPTY_POSITION = {
  yesBet: 0n,
  noBet: 0n,
  claimed: false,
};

const HISTORY_LIMIT = 48;
const MARKET_POLL_INTERVAL_MS = 10000;
const TX_SCAN_DEPTH = 260;
const TX_HISTORY_LIMIT = 24;
const TX_BLOCK_BATCH = 12;

export function usePredictionMarket({ signer, account }) {
  const [market, setMarket] = useState(EMPTY_MARKET);
  const [position, setPosition] = useState(EMPTY_POSITION);
  const [marketHistory, setMarketHistory] = useState([]);
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [isPositionLoading, setIsPositionLoading] = useState(false);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [isTxHistoryLoading, setIsTxHistoryLoading] = useState(false);
  const [lastTxSyncAt, setLastTxSyncAt] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  const mountedRef = useRef(false);
  const readProviderRef = useRef(null);

  if (!readProviderRef.current) {
    readProviderRef.current = new ethers.JsonRpcProvider(APP_CONFIG.rpcUrl);
  }

  const contractAddress = APP_CONFIG.contractAddress;
  const hasContractAddress = Boolean(contractAddress);
  const contractInterface = useMemo(() => new ethers.Interface(CONTRACT_ABI), []);

  const readContract = useMemo(() => {
    if (!hasContractAddress) return null;
    return new ethers.Contract(contractAddress, CONTRACT_ABI, readProviderRef.current);
  }, [contractAddress, hasContractAddress]);

  const writeContract = useMemo(() => {
    if (!hasContractAddress || !signer) return null;
    return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  }, [contractAddress, hasContractAddress, signer]);

  const addOrUpdateTx = useCallback((nextTx) => {
    setTransactions((prev) => {
      const idx = prev.findIndex((tx) => tx.hash === nextTx.hash);
      if (idx === -1) {
        return [nextTx, ...prev].slice(0, TX_HISTORY_LIMIT);
      }

      const clone = [...prev];
      clone[idx] = { ...clone[idx], ...nextTx };
      return clone;
    });
  }, []);

  const labelForTxData = useCallback((data) => {
    try {
      const parsed = contractInterface.parseTransaction({ data: data || '0x' });
      const method = parsed?.name || '';
      if (method === 'buyYes') return 'Buy YES';
      if (method === 'buyNo') return 'Buy NO';
      if (method === 'claimReward') return 'Claim Reward';
      if (method === 'resolveMarket') {
        return parsed?.args?.[0] ? 'Resolve YES' : 'Resolve NO';
      }
      return method || 'Contract Call';
    } catch {
      return 'Contract Call';
    }
  }, [contractInterface]);

  const refreshTransactions = useCallback(async () => {
    if (!hasContractAddress || !account) {
      setTransactions((prev) => prev.filter((tx) => tx.source !== 'chain'));
      setIsTxHistoryLoading(false);
      return;
    }

    setIsTxHistoryLoading(true);
    try {
      const provider = readProviderRef.current;
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - TX_SCAN_DEPTH);
      const contractLower = contractAddress.toLowerCase();
      const accountLower = account.toLowerCase();
      const blockNumbers = [];
      for (let blockNumber = latestBlock; blockNumber >= fromBlock; blockNumber -= 1) {
        blockNumbers.push(blockNumber);
      }

      const chainTxs = [];
      for (let idx = 0; idx < blockNumbers.length; idx += TX_BLOCK_BATCH) {
        if (chainTxs.length >= TX_HISTORY_LIMIT) break;
        const chunk = blockNumbers.slice(idx, idx + TX_BLOCK_BATCH);
        const blocks = await Promise.all(chunk.map(async (blockNumber) => {
          const hexBlock = `0x${blockNumber.toString(16)}`;
          const block = await provider.send('eth_getBlockByNumber', [hexBlock, true]).catch(() => null);
          return { blockNumber, block };
        }));

        for (const { block } of blocks) {
          if (chainTxs.length >= TX_HISTORY_LIMIT) break;
          const txs = Array.isArray(block?.transactions) ? block.transactions : [];
          const blockTimestamp = typeof block?.timestamp === 'string'
            ? Number.parseInt(block.timestamp, 16)
            : Number(block?.timestamp || Math.floor(Date.now() / 1000));

          for (const tx of txs) {
            if (chainTxs.length >= TX_HISTORY_LIMIT) break;
            if (!tx || typeof tx === 'string') continue;
            if (!tx.to || !tx.from) continue;
            if (String(tx.to).toLowerCase() !== contractLower) continue;
            if (String(tx.from).toLowerCase() !== accountLower) continue;

            const receipt = await provider.send('eth_getTransactionReceipt', [tx.hash]).catch(() => null);
            const receiptStatus = typeof receipt?.status === 'string'
              ? Number.parseInt(receipt.status, 16)
              : Number(receipt?.status || 0);
            chainTxs.push({
              hash: tx.hash,
              label: labelForTxData(tx.data ?? tx.input),
              status: receiptStatus === 1 ? 'confirmed' : 'pending',
              createdAt: blockTimestamp * 1000,
              source: 'chain',
            });
          }
        }
      }

      if (!mountedRef.current) return;

      setTransactions((prev) => {
        const sessionTxs = prev.filter((tx) => tx.source !== 'chain');
        const txMap = new Map();

        for (const tx of [...chainTxs, ...sessionTxs]) {
          const existing = txMap.get(tx.hash);
          txMap.set(tx.hash, existing ? { ...existing, ...tx } : tx);
        }

        return [...txMap.values()]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, TX_HISTORY_LIMIT);
      });
      setLastTxSyncAt(Date.now());
      setError('');
    } catch (fetchError) {
      if (!mountedRef.current) return;
      setError(parseContractError(fetchError));
    } finally {
      if (mountedRef.current) {
        setIsTxHistoryLoading(false);
      }
    }
  }, [account, contractAddress, hasContractAddress, labelForTxData]);

  const refreshMarket = useCallback(async () => {
    if (!readContract) {
      setIsMarketLoading(false);
      return;
    }

    setIsMarketLoading(true);
    try {
      const [question, deadline, yesPool, noPool, resolved, outcome, owner] = await Promise.all([
        readContract.question(),
        readContract.deadline(),
        readContract.yesPool(),
        readContract.noPool(),
        readContract.resolved(),
        readContract.outcome(),
        readContract.owner(),
      ]);

      if (!mountedRef.current) return;

      setMarket({
        question,
        deadline,
        yesPool,
        noPool,
        resolved,
        outcome,
        owner,
      });

      const yesPoolNum = Number(ethers.formatEther(yesPool || 0n));
      const noPoolNum = Number(ethers.formatEther(noPool || 0n));
      const totalPoolNum = yesPoolNum + noPoolNum;
      const yesPct = totalPoolNum > 0 ? (yesPoolNum / totalPoolNum) * 100 : 50;

      setMarketHistory((prev) => {
        const nextPoint = {
          timestamp: Date.now(),
          yesPool: yesPoolNum,
          noPool: noPoolNum,
          totalPool: totalPoolNum,
          yesPct,
          noPct: 100 - yesPct,
          yesPoolWei: (yesPool || 0n).toString(),
          noPoolWei: (noPool || 0n).toString(),
        };

        const last = prev[prev.length - 1];
        if (
          last
          && last.yesPoolWei === nextPoint.yesPoolWei
          && last.noPoolWei === nextPoint.noPoolWei
        ) {
          return prev;
        }

        return [...prev, nextPoint].slice(-HISTORY_LIMIT);
      });
      setError('');
    } catch (fetchError) {
      if (!mountedRef.current) return;
      setError(parseContractError(fetchError));
    } finally {
      if (mountedRef.current) {
        setIsMarketLoading(false);
      }
    }
  }, [readContract]);

  const refreshPosition = useCallback(async () => {
    if (!readContract || !account) {
      setPosition(EMPTY_POSITION);
      setIsPositionLoading(false);
      return;
    }

    setIsPositionLoading(true);
    try {
      const [yesBet, noBet, claimed] = await Promise.all([
        readContract.yesBets(account),
        readContract.noBets(account),
        readContract.claimed(account),
      ]);

      if (!mountedRef.current) return;
      setPosition({ yesBet, noBet, claimed });
      setError('');
    } catch (fetchError) {
      if (!mountedRef.current) return;
      setError(parseContractError(fetchError));
    } finally {
      if (mountedRef.current) {
        setIsPositionLoading(false);
      }
    }
  }, [account, readContract]);

  useEffect(() => {
    mountedRef.current = true;
    refreshMarket();
    const timerId = setInterval(refreshMarket, MARKET_POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(timerId);
    };
  }, [refreshMarket]);

  useEffect(() => {
    refreshPosition();
  }, [refreshPosition]);

  useEffect(() => {
    if (!account) return;
    refreshMarket();
  }, [account, refreshMarket]);

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const runAction = useCallback(async (label, requestTx) => {
    if (!writeContract) {
      return { success: false, error: 'Connect wallet on the correct network first.' };
    }

    setIsActionRunning(true);
    try {
      const tx = await requestTx(writeContract);
      addOrUpdateTx({
        hash: tx.hash,
        label,
        status: 'pending',
        createdAt: Date.now(),
        source: 'session',
      });

      await tx.wait();

      addOrUpdateTx({
        hash: tx.hash,
        label,
        status: 'confirmed',
        createdAt: Date.now(),
        source: 'session',
      });

      await Promise.all([refreshMarket(), refreshPosition(), refreshTransactions()]);
      return { success: true, txHash: tx.hash };
    } catch (actionError) {
      return { success: false, error: parseContractError(actionError) };
    } finally {
      if (mountedRef.current) {
        setIsActionRunning(false);
      }
    }
  }, [addOrUpdateTx, refreshMarket, refreshPosition, refreshTransactions, writeContract]);

  const placeBet = useCallback(async (side, amountText) => {
    const value = parseTokenInput(amountText);
    if (!value) {
      return { success: false, error: 'Enter a valid amount greater than 0.' };
    }

    const submitBet = async (contract, method) => {
      try {
        return await contract[method]({ value });
      } catch (error) {
        const msg = String(error?.shortMessage || error?.message || '').toLowerCase();
        const shouldRetryWithGasLimit = msg.includes('estimate') || msg.includes('intrinsic gas');
        if (!shouldRetryWithGasLimit) throw error;
        return contract[method]({ value, gasLimit: 350000n });
      }
    };

    if (side === 'yes') {
      return runAction('Buy YES', (contract) => submitBet(contract, 'buyYes'));
    }
    if (side === 'no') {
      return runAction('Buy NO', (contract) => submitBet(contract, 'buyNo'));
    }
    return { success: false, error: 'Invalid market side.' };
  }, [runAction]);

  const claimReward = useCallback(() => {
    return runAction('Claim Reward', (contract) => contract.claimReward());
  }, [runAction]);

  const resolveMarket = useCallback((outcome) => {
    return runAction(outcome ? 'Resolve YES' : 'Resolve NO', (contract) => contract.resolveMarket(outcome));
  }, [runAction]);

  const status = getMarketStatus(market);
  const totalPool = (market.yesPool || 0n) + (market.noPool || 0n);
  const isOwner = Boolean(account && market.owner && market.owner.toLowerCase() === account.toLowerCase());
  const isAdmin = isOwner;
  const fluctuation = useMemo(() => {
    const points = marketHistory;
    const last = points[points.length - 1] || null;
    const comparePoint = points.length > 8 ? points[points.length - 8] : points[0] || null;

    if (!last || !comparePoint) {
      return {
        yesShiftPct: 0,
        noShiftPct: 0,
        poolShift: 0,
        windowLabel: 'Waiting for market movement',
      };
    }

    const elapsedMs = Math.max(last.timestamp - comparePoint.timestamp, 0);
    const elapsedMinutes = elapsedMs / 60000;
    const windowLabel = elapsedMinutes >= 1
      ? `Last ${elapsedMinutes.toFixed(1)} min`
      : 'Recent movement';

    return {
      yesShiftPct: last.yesPct - comparePoint.yesPct,
      noShiftPct: last.noPct - comparePoint.noPct,
      poolShift: last.totalPool - comparePoint.totalPool,
      windowLabel,
    };
  }, [marketHistory]);
  const userWon = Boolean(
    market.resolved &&
    ((market.outcome && position.yesBet > 0n) || (!market.outcome && position.noBet > 0n))
  );
  const isClaimable = userWon && !position.claimed;
  const claimEstimate = useMemo(() => {
    if (!market.resolved) return 0n;
    if (market.outcome) {
      if (!position.yesBet || position.yesBet <= 0n || !market.yesPool || market.yesPool <= 0n) return 0n;
      return (position.yesBet * totalPool) / market.yesPool;
    }
    if (!position.noBet || position.noBet <= 0n || !market.noPool || market.noPool <= 0n) return 0n;
    return (position.noBet * totalPool) / market.noPool;
  }, [market.noPool, market.outcome, market.resolved, market.yesPool, position.noBet, position.yesBet, totalPool]);
  const refreshPortfolio = useCallback(async () => {
    await Promise.all([refreshMarket(), refreshPosition(), refreshTransactions()]);
  }, [refreshMarket, refreshPosition, refreshTransactions]);
  const isPortfolioRefreshing = isMarketLoading || isPositionLoading || isTxHistoryLoading;

  return {
    market,
    position,
    status,
    totalPool,
    isOwner,
    isAdmin,
    userWon,
    isClaimable,
    isMarketLoading,
    isPositionLoading,
    isTxHistoryLoading,
    isActionRunning,
    isPortfolioRefreshing,
    hasContractAddress,
    error,
    transactions,
    marketHistory,
    fluctuation,
    claimEstimate,
    lastTxSyncAt,
    refreshMarket,
    refreshPosition,
    refreshTransactions,
    refreshPortfolio,
    placeBet,
    claimReward,
    resolveMarket,
  };
}
