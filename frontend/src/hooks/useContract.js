import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import { parseEther } from '../utils';

export function useContract(signer) {
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [marketData, setMarketData] = useState({
    question: '',
    deadline: 0n,
    yesPool: 0n,
    noPool: 0n,
    resolved: false,
    outcome: false,
    owner: '',
  });
  const [userBets, setUserBets] = useState({ yesBet: 0n, noBet: 0n });
  const [userClaimed, setUserClaimed] = useState(false);

  // Use ref to track loading state and prevent concurrent fetches
  const isFetchingRef = useRef(false);
  const contractRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      contractRef.current = null;
    };
  }, []);

  // Initialize contract - only when signer changes
  useEffect(() => {
    if (!signer) {
      if (isMountedRef.current) {
        setContract(null);
        setIsLoading(false);
      }
      contractRef.current = null;
      return;
    }

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
      }

      const predictionContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      if (isMountedRef.current) {
        setContract(predictionContract);
      }
      contractRef.current = predictionContract;
    } catch (error) {
      console.error('Error creating contract:', error);
      if (isMountedRef.current) {
        setIsLoading(false);
        setHasError(true);
      }
    }
  }, [signer]);

  // Fetch market data - stable function, only depends on contract
  const fetchMarketData = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    if (!contractRef.current) return;

    isFetchingRef.current = true;

    if (isMountedRef.current) {
      setIsLoading(true);
    }

    try {
      const c = contractRef.current;
      const [question, deadline, yesPool, noPool, resolved, outcome, owner] = await Promise.all([
        c.question(),
        c.deadline(),
        c.yesPool(),
        c.noPool(),
        c.resolved(),
        c.outcome(),
        c.owner(),
      ]);

      if (isMountedRef.current) {
        setMarketData({
          question,
          deadline,
          yesPool,
          noPool,
          resolved,
          outcome,
          owner,
        });
        setHasError(false);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      if (isMountedRef.current) {
        setHasError(true);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []); // Stable reference via refs

  // Fetch user bets
  const fetchUserBets = useCallback(async (userAddress) => {
    if (!contractRef.current || !userAddress) return;

    try {
      const c = contractRef.current;
      const [yesBet, noBet, claimed] = await Promise.all([
        c.yesBets(userAddress),
        c.noBets(userAddress),
        c.claimed(userAddress),
      ]);

      if (isMountedRef.current) {
        setUserBets({ yesBet, noBet });
        setUserClaimed(claimed);
      }
    } catch (error) {
      console.error('Error fetching user bets:', error);
    }
  }, []); // Stable reference via refs

  const getRunnerAddress = useCallback(async () => {
    const runner = contractRef.current?.runner;
    if (!runner) return null;

    if (typeof runner.getAddress === 'function') {
      return runner.getAddress();
    }

    if (typeof runner.address === 'string' && runner.address) {
      return runner.address;
    }

    return null;
  }, []);

  // Buy YES tokens
  const buyYes = useCallback(async (amount) => {
    if (!contractRef.current) {
      return { success: false, txHash: null };
    }

    try {
      const value = parseEther(amount);
      const tx = await contractRef.current.buyYes({ value });
      
      await tx.wait();
      
      // Refresh data after successful transaction
      await fetchMarketData();
      const userAddress = await getRunnerAddress();
      if (userAddress) {
        await fetchUserBets(userAddress);
      }
      
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error buying YES:', error);
      return { success: false, txHash: null, error: error.message };
    }
  }, [fetchMarketData, fetchUserBets, getRunnerAddress]);

  // Buy NO tokens
  const buyNo = useCallback(async (amount) => {
    if (!contractRef.current) {
      return { success: false, txHash: null };
    }

    try {
      const value = parseEther(amount);
      const tx = await contractRef.current.buyNo({ value });
      
      await tx.wait();
      
      // Refresh data after successful transaction
      await fetchMarketData();
      const userAddress = await getRunnerAddress();
      if (userAddress) {
        await fetchUserBets(userAddress);
      }
      
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error buying NO:', error);
      return { success: false, txHash: null, error: error.message };
    }
  }, [fetchMarketData, fetchUserBets, getRunnerAddress]);

  // Resolve market (owner only)
  const resolveMarket = useCallback(async (outcome) => {
    if (!contractRef.current) {
      return { success: false, txHash: null };
    }

    try {
      const tx = await contractRef.current.resolveMarket(outcome);
      
      await tx.wait();
      
      // Refresh data after successful transaction
      await fetchMarketData();
      
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error resolving market:', error);
      return { success: false, txHash: null, error: error.message };
    }
  }, [fetchMarketData]);

  // Claim reward
  const claimReward = useCallback(async () => {
    if (!contractRef.current) {
      return { success: false, txHash: null };
    }

    try {
      const tx = await contractRef.current.claimReward();
      
      await tx.wait();
      
      // Refresh data after successful transaction
      await fetchMarketData();
      const userAddress = await getRunnerAddress();
      if (userAddress) {
        await fetchUserBets(userAddress);
      }
      
      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, txHash: null, error: error.message };
    }
  }, [fetchMarketData, fetchUserBets, getRunnerAddress]);

  // Check if user is owner
  const isOwner = useCallback(async (address) => {
    if (!contractRef.current || !address) return false;
    try {
      const owner = await contractRef.current.owner();
      return owner.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }, []);

  return {
    contract,
    isLoading,
    hasError,
    marketData,
    userBets,
    userClaimed,
    fetchMarketData,
    fetchUserBets,
    buyYes,
    buyNo,
    resolveMarket,
    claimReward,
    isOwner,
  };
}
