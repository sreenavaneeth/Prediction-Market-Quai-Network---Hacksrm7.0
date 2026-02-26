import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { formatEther, formatDate, getTimeRemaining, calculateOdds } from '../utils';

export function MarketCard({ marketData, isLoading }) {
  const { question, deadline, yesPool, noPool, resolved, outcome } = marketData;
  
  const totalPool = yesPool + noPool;
  const yesPercentage = totalPool > 0 ? (Number(yesPool) / Number(totalPool) * 100).toFixed(1) : '50';
  const noPercentage = totalPool > 0 ? (Number(noPool) / Number(totalPool) * 100).toFixed(1) : '50';
  const odds = calculateOdds(yesPool, noPool);

  if (isLoading) {
    return (
      <Card className="w-full">
        <div className="space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex justify-between">
            <Skeleton className="h-20 w-40" />
            <Skeleton className="h-20 w-40" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full" glow>
        {/* Question */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">{question}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(deadline)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{getTimeRemaining(deadline)}</span>
            </div>
          </div>
        </div>

        {/* Pool Visualization */}
        <div className="mb-6">
          <div className="flex h-4 rounded-full overflow-hidden bg-secondary">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${yesPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-gradient-to-r from-cyan-500 to-cyan-400"
            />
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${noPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-gradient-to-r from-red-500 to-rose-500"
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-cyan-400">YES {yesPercentage}%</span>
            <span className="text-red-400">NO {noPercentage}%</span>
          </div>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-secondary/30 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-muted-foreground">YES Pool</span>
            </div>
            <p className="text-2xl font-bold">{formatEther(yesPool)} QUAI</p>
            <p className="text-sm text-muted-foreground">Odds: {odds.yes}x</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-sm text-muted-foreground">NO Pool</span>
            </div>
            <p className="text-2xl font-bold">{formatEther(noPool)} QUAI</p>
            <p className="text-sm text-muted-foreground">Odds: {odds.no}x</p>
          </div>
        </div>

        {/* Market Status */}
        {resolved && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border ${
              outcome 
                ? 'bg-cyan-500/10 border-cyan-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {outcome ? (
                <>
                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                  <div>
                    <p className="font-semibold text-cyan-400">Market Resolved: YES</p>
                    <p className="text-sm text-muted-foreground">YES bettors won this market</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-400">Market Resolved: NO</p>
                    <p className="text-sm text-muted-foreground">NO bettors won this market</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {!resolved && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-warning" />
              <div>
                <p className="font-semibold text-warning">Market Pending</p>
                <p className="text-sm text-muted-foreground">Place your bets before the deadline</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
