import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { APP_CONFIG } from './config';
import { useWallet } from './hooks/useWallet';
import { usePredictionMarket } from './hooks/usePredictionMarket';
import { explorerAddressUrl } from './utils/format';
import {
  BetPanel,
  Header,
  HowItWorks,
  LandingPage,
  MarketHero,
  OwnerPanel,
  PendingOverlay,
  PortfolioPanel,
  SystemBanner,
  TxFeed,
} from './components';

export default function App() {
  const location = useLocation();
  const wallet = useWallet();
  const market = usePredictionMarket({
    signer: wallet.signer,
    account: wallet.account,
  });

  const [pendingLabel, setPendingLabel] = useState('');
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('route-enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('route-exit');
    }
  }, [displayLocation.pathname, location.pathname]);

  const runWithFeedback = useCallback(async (actionLabel, operation) => {
    setPendingLabel(actionLabel);
    const loadingToast = toast.loading(`${actionLabel} in progress...`);

    try {
      const result = await operation();
      if (!result?.success) {
        toast.error(result?.error || 'Action failed.');
        return result;
      }

      if (result.txHash) {
        toast.success(`${actionLabel} confirmed: ${result.txHash.slice(0, 10)}...`);
      } else {
        toast.success(`${actionLabel} completed.`);
      }
      return result;
    } catch (error) {
      toast.error(error?.message || 'Unexpected error.');
      return { success: false, error: error?.message || 'Unexpected error.' };
    } finally {
      toast.dismiss(loadingToast);
      setPendingLabel('');
    }
  }, []);

  const handleConnect = useCallback(async () => {
    const result = await wallet.connectWallet();
    if (!result.success) {
      toast.error(result.error || 'Unable to connect wallet.');
      return;
    }
    toast.success('Wallet connected.');
  }, [wallet]);

  const handleSwitchNetwork = useCallback(async () => {
    const result = await wallet.switchNetwork();
    if (!result.success) {
      toast.error(result.error || 'Failed to switch network.');
      return;
    }
    toast.success(`Switched to ${APP_CONFIG.chainName}.`);
  }, [wallet]);

  const handleBet = useCallback((side, amountText) => {
    return runWithFeedback(
      side === 'yes' ? 'YES bet' : 'NO bet',
      () => market.placeBet(side, amountText)
    );
  }, [market, runWithFeedback]);

  const handleClaim = useCallback(() => {
    return runWithFeedback('Reward claim', market.claimReward);
  }, [market.claimReward, runWithFeedback]);

  const handleResolve = useCallback((outcome) => {
    return runWithFeedback(
      outcome ? 'Resolve YES' : 'Resolve NO',
      () => market.resolveMarket(outcome)
    );
  }, [market, runWithFeedback]);

  const systemBanner = useMemo(() => {
    if (!market.hasContractAddress) {
      return {
        tone: 'error',
        text: 'Contract address not configured. Add VITE_CONTRACT_ADDRESS to frontend/.env.',
      };
    }
    if (market.error) {
      return { tone: 'warn', text: market.error };
    }
    return null;
  }, [market.error, market.hasContractAddress]);

  const contractExplorerLink = APP_CONFIG.contractAddress
    ? explorerAddressUrl(APP_CONFIG.contractAddress)
    : '#';

  return (
    <div className="app-shell">
      <div className="bg-shape bg-shape-one" />
      <div className="bg-shape bg-shape-two" />

      <Header wallet={wallet} onConnect={handleConnect} onSwitchNetwork={handleSwitchNetwork} />
      <PendingOverlay active={Boolean(pendingLabel || market.isActionRunning)} label={pendingLabel} />

      <main className="main-content">
        {systemBanner && <SystemBanner tone={systemBanner.tone} text={systemBanner.text} />}

        <div
          className={`route-transition ${transitionStage}`}
          onAnimationEnd={() => {
            if (transitionStage === 'route-exit') {
              setDisplayLocation(location);
              setTransitionStage('route-enter');
            }
          }}
        >
          <Routes location={displayLocation}>
            <Route
              path="/"
              element={(
                <LandingPage
                  wallet={wallet}
                  market={market.market}
                  status={market.status}
                  totalPool={market.totalPool}
                  onConnect={handleConnect}
                  onSwitchNetwork={handleSwitchNetwork}
                />
              )}
            />

            <Route
              path="/market"
              element={(
                <>
                  <MarketHero
                    market={market.market}
                    status={market.status}
                    totalPool={market.totalPool}
                    marketHistory={market.marketHistory}
                    fluctuation={market.fluctuation}
                    isLoading={market.isMarketLoading}
                  />

                  <section className="grid-two">
                    <BetPanel
                      wallet={wallet}
                      market={market.market}
                      status={market.status}
                      totalPool={market.totalPool}
                      onBet={handleBet}
                      isActionRunning={market.isActionRunning}
                    />

                    <div className="stack">
                      <PortfolioPanel
                        market={market.market}
                        position={market.position}
                        totalPool={market.totalPool}
                        status={market.status}
                        isConnected={wallet.isConnected}
                        isCorrectNetwork={wallet.isCorrectNetwork}
                        isClaimable={market.isClaimable}
                        userWon={market.userWon}
                        claimEstimate={market.claimEstimate}
                        onRefresh={market.refreshPortfolio}
                        onClaim={handleClaim}
                        isRefreshing={market.isPortfolioRefreshing}
                        isActionRunning={market.isActionRunning}
                        compact
                      />

                      <OwnerPanel
                        isOwner={market.isAdmin}
                        status={market.status}
                        market={market.market}
                        wallet={wallet}
                        totalPool={market.totalPool}
                        onResolve={handleResolve}
                        isActionRunning={market.isActionRunning}
                      />
                    </div>
                  </section>

                  <HowItWorks />
                </>
              )}
            />

            <Route
              path="/portfolio"
              element={(
                <section className="grid-two">
                  <PortfolioPanel
                    market={market.market}
                    position={market.position}
                    totalPool={market.totalPool}
                    status={market.status}
                    isConnected={wallet.isConnected}
                    isCorrectNetwork={wallet.isCorrectNetwork}
                    isClaimable={market.isClaimable}
                    userWon={market.userWon}
                    claimEstimate={market.claimEstimate}
                    onRefresh={market.refreshPortfolio}
                    onClaim={handleClaim}
                    isRefreshing={market.isPortfolioRefreshing}
                    isActionRunning={market.isActionRunning}
                  />
                  <TxFeed
                    transactions={market.transactions}
                    isLoading={market.isTxHistoryLoading}
                    onRefresh={market.refreshTransactions}
                    lastSyncedAt={market.lastTxSyncAt}
                  />
                </section>
              )}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <footer className="footer">
        <span>Built for transparent, non-custodial settlement on Quai.</span>
        <Link to="/market">Open Market</Link>
        <a href={contractExplorerLink} target="_blank" rel="noreferrer">
          View contract
        </a>
        <Link to="/portfolio">Open Portfolio</Link>
      </footer>
    </div>
  );
}
