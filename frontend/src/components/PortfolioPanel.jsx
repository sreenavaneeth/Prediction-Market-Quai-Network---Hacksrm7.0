import { APP_CONFIG } from '../config';
import { calcImpliedMultiplier, formatToken } from '../utils/format';

export function PortfolioPanel({
  market,
  position,
  totalPool,
  status,
  isConnected,
  isCorrectNetwork,
  isClaimable,
  userWon,
  onClaim,
  onRefresh,
  claimEstimate,
  isActionRunning,
  isRefreshing = false,
  compact = false,
}) {
  const hasPosition = position.yesBet > 0n || position.noBet > 0n;
  const canClaim = isClaimable && status === 'resolved' && !isActionRunning;

  let claimMessage = 'No reward available.';
  if (!isConnected) {
    claimMessage = 'Connect wallet to check rewards.';
  } else if (!isCorrectNetwork) {
    claimMessage = 'Switch network to load reward status.';
  } else if (status !== 'resolved') {
    claimMessage = 'Claim unlocks after market resolution.';
  } else if (canClaim) {
    claimMessage = 'You can claim now.';
  } else if (position.claimed) {
    claimMessage = 'Reward already claimed.';
  } else if (hasPosition && !userWon) {
    claimMessage = 'This position did not win.';
  }

  return (
    <section className="card">
      <div className="panel-head">
        <h3>{compact ? 'My Position' : 'Portfolio View'}</h3>
        {!compact && (
          <button
            type="button"
            className="btn ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>
      {!compact && (
        <p className="subtle-text">
          Track side exposure, implied odds, and claimable rewards.
        </p>
      )}

      {!isConnected && <div className="notice">Connect wallet to view your positions.</div>}
      {isConnected && !isCorrectNetwork && (
        <div className="notice warn">Switch network to view accurate on-chain positions.</div>
      )}

      <div className="position-grid">
        <article>
          <small>YES Stake</small>
          <strong>{formatToken(position.yesBet)} {APP_CONFIG.currencySymbol}</strong>
          <span>Implied: {calcImpliedMultiplier(market.yesPool, totalPool)}</span>
        </article>
        <article>
          <small>NO Stake</small>
          <strong>{formatToken(position.noBet)} {APP_CONFIG.currencySymbol}</strong>
          <span>Implied: {calcImpliedMultiplier(market.noPool, totalPool)}</span>
        </article>
      </div>

      {!hasPosition && isConnected && (
        <div className="notice">No open position yet. Place a bet to start tracking.</div>
      )}

      <div className="claim-card">
        <div>
          <small>Claimable Rewards</small>
          <p>{claimMessage}</p>
          <small className="claim-estimate">
            Est. claim: {formatToken(claimEstimate)} {APP_CONFIG.currencySymbol}
          </small>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={onClaim}
          disabled={!canClaim}
        >
          Claim Reward
        </button>
      </div>

      <div className="formula">
        <small>Payout formula</small>
        <code>yourBet * totalPool / winningPool</code>
      </div>
    </section>
  );
}
