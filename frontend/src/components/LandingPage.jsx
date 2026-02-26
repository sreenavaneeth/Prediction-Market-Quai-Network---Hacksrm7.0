import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../config';
import {
  calcPools,
  formatAddress,
  formatCountdown,
  formatDateTime,
  formatStatus,
  formatToken,
} from '../utils/format';

export function LandingPage({
  wallet,
  market,
  status,
  totalPool,
  onConnect,
  onSwitchNetwork,
}) {
  const pools = calcPools(market.yesPool, market.noPool);

  return (
    <section className="landing-wrap">
      <article className="landing-hero card">
        <div className="landing-copy">
          <span className="landing-chip">Transparent. Non-custodial. On-chain.</span>
          <h2>Trade real outcomes on Quai Prediction Market.</h2>
          <p>
            Place YES/NO positions, watch live pool movement, and claim rewards from a
            contract-settled market with full on-chain verifiability.
          </p>

          <div className="landing-cta-row">
            <Link to="/market" className="btn primary">
              Enter Market
            </Link>
            <Link to="/portfolio" className="btn ghost">
              View Portfolio
            </Link>
            {!wallet.isConnected && (
              <button
                type="button"
                className="btn ghost"
                onClick={onConnect}
                disabled={wallet.isConnecting || !wallet.isWalletInstalled}
              >
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            {wallet.isConnected && !wallet.isCorrectNetwork && (
              <button type="button" className="btn ghost" onClick={onSwitchNetwork}>
                Switch to {APP_CONFIG.chainName}
              </button>
            )}
          </div>

          <div className="landing-trust-grid">
            <article>
              <small>Settlement</small>
              <strong>Smart-contract based payout logic</strong>
            </article>
            <article>
              <small>Security</small>
              <strong>Funds stay on-chain until claim</strong>
            </article>
            <article>
              <small>Network</small>
              <strong>{APP_CONFIG.chainName} ({APP_CONFIG.chainId})</strong>
            </article>
          </div>
        </div>

        <div className="landing-preview">
          <header>
            <h3>Live Market Snapshot</h3>
            <span className={`status-pill ${status}`}>{formatStatus(status)}</span>
          </header>

          <p className="preview-question">{market.question || 'Loading market question...'}</p>

          <div className="preview-metrics">
            <article>
              <small>Total Pool</small>
              <strong>{formatToken(totalPool, 3)} {APP_CONFIG.currencySymbol}</strong>
            </article>
            <article>
              <small>Deadline</small>
              <strong>{formatDateTime(market.deadline)}</strong>
            </article>
            <article>
              <small>Time Left</small>
              <strong>{formatCountdown(market.deadline)}</strong>
            </article>
          </div>

          <div className="pool-track">
            <div className="pool-yes" style={{ width: `${pools.yesPct}%` }} />
            <div className="pool-no" style={{ width: `${pools.noPct}%` }} />
          </div>

          <div className="pool-legend">
            <div>
              <span className="dot yes" />
              YES {pools.yesPct.toFixed(1)}% ({formatToken(market.yesPool, 2)})
            </div>
            <div>
              <span className="dot no" />
              NO {pools.noPct.toFixed(1)}% ({formatToken(market.noPool, 2)})
            </div>
          </div>

          <div className="landing-account">
            <small>Connected Wallet</small>
            <strong>{wallet.isConnected ? formatAddress(wallet.account) : 'Not connected'}</strong>
          </div>
        </div>
      </article>

      <section className="landing-steps">
        <article className="card">
          <small>Step 1</small>
          <h4>Connect Wallet</h4>
          <p>Link Pelagus wallet and switch to the required Quai testnet.</p>
        </article>
        <article className="card">
          <small>Step 2</small>
          <h4>Buy YES / NO</h4>
          <p>Place your position with live odds and payout preview before signing.</p>
        </article>
        <article className="card">
          <small>Step 3</small>
          <h4>Claim Rewards</h4>
          <p>After owner resolution, winners claim rewards directly from contract.</p>
        </article>
      </section>
    </section>
  );
}

