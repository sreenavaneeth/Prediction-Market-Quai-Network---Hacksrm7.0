import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { formatEther, calculateWinnings, calculateOdds } from '../utils';

export function BettingPanel({ 
  marketData, 
  userBets, 
  isConnected, 
  isCorrectNet,
  isLoading,
  onBuyYes, 
  onBuyNo,
  isBuying 
}) {
  const [yesAmount, setYesAmount] = useState('');
  const [noAmount, setNoAmount] = useState('');

  const { yesPool, noPool, deadline, resolved } = marketData;
  const isMarketOpen = !resolved && Number(deadline) > Math.floor(Date.now() / 1000);
  const odds = calculateOdds(yesPool, noPool);

  const yesWinnings = calculateWinnings(
    yesAmount ? BigInt(Math.floor(Number(yesAmount) * 1e18)) : 0n,
    yesPool,
    noPool
  );

  const noWinnings = calculateWinnings(
    noAmount ? BigInt(Math.floor(Number(noAmount) * 1e18)) : 0n,
    noPool,
    yesPool
  );

  const handleYesChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setYesAmount(value);
    }
  };

  const handleNoChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setNoAmount(value);
    }
  };

  const handleBuyYes = async () => {
    if (!yesAmount || Number(yesAmount) <= 0) return;
    const result = await onBuyYes(yesAmount);
    if (result.success) {
      setYesAmount('');
    }
  };

  const handleBuyNo = async () => {
    if (!noAmount || Number(noAmount) <= 0) return;
    const result = await onBuyNo(noAmount);
    if (result.success) {
      setNoAmount('');
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <div className="text-center py-8">
          <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Connect your wallet to place bets</p>
        </div>
      </Card>
    );
  }

  if (!isCorrectNet) {
    return (
      <Card className="w-full">
        <div className="text-center py-8">
          <p className="text-warning">Please switch to Quai Network to place bets</p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="w-full">
        <h3 className="text-lg font-semibold mb-6">Place Your Bet</h3>

        <div className="space-y-6">
          {/* YES Bet */}
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold text-cyan-400">Buy YES</span>
              </div>
              <span className="text-sm text-muted-foreground">Odds: {odds.yes}x</span>
            </div>
            
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="0.0"
                value={yesAmount}
                onChange={handleYesChange}
                disabled={!isMarketOpen || isLoading}
              />
              <Button
                onClick={handleBuyYes}
                disabled={!yesAmount || Number(yesAmount) <= 0 || !isMarketOpen || isBuying}
                isLoading={isBuying}
                variant="primary"
              >
                Buy YES
              </Button>
            </div>

            {yesAmount && Number(yesAmount) > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 text-sm text-muted-foreground"
              >
                Potential winnings: <span className="text-cyan-400 font-semibold">{yesWinnings} QUAI</span>
              </motion.div>
            )}

            {userBets.yesBet > 0n && (
              <div className="mt-3 text-sm text-muted-foreground">
                Your position: <span className="text-cyan-400 font-semibold">{formatEther(userBets.yesBet)} QUAI</span>
              </div>
            )}
          </div>

          {/* NO Bet */}
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">Buy NO</span>
              </div>
              <span className="text-sm text-muted-foreground">Odds: {odds.no}x</span>
            </div>
            
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="0.0"
                value={noAmount}
                onChange={handleNoChange}
                disabled={!isMarketOpen || isLoading}
              />
              <Button
                onClick={handleBuyNo}
                disabled={!noAmount || Number(noAmount) <= 0 || !isMarketOpen || isBuying}
                isLoading={isBuying}
                variant="danger"
              >
                Buy NO
              </Button>
            </div>

            {noAmount && Number(noAmount) > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 text-sm text-muted-foreground"
              >
                Potential winnings: <span className="text-red-400 font-semibold">{noWinnings} QUAI</span>
              </motion.div>
            )}

            {userBets.noBet > 0n && (
              <div className="mt-3 text-sm text-muted-foreground">
                Your position: <span className="text-red-400 font-semibold">{formatEther(userBets.noBet)} QUAI</span>
              </div>
            )}
          </div>
        </div>

        {!isMarketOpen && !resolved && (
          <div className="mt-4 p-3 rounded-lg bg-warning/10 text-warning text-sm text-center">
            Market has ended. Waiting for resolution...
          </div>
        )}
      </Card>
    </motion.div>
  );
}
