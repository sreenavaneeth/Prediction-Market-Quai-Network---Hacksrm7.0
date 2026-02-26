import { APP_CONFIG } from '../config';
import {
  calcImpliedMultiplier,
  calcPools,
  formatCountdown,
  formatDateTime,
  formatStatus,
  formatToken,
} from '../utils/format';

function formatShift(value, suffix = '%') {
  const fixed = Number(value || 0).toFixed(2);
  if (Number(fixed) > 0) return `+${fixed}${suffix}`;
  return `${fixed}${suffix}`;
}

function buildTrendPath(points, key, width, height) {
  if (!points.length) return '';
  if (points.length === 1) return `0,${height / 2}`;

  return points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((point[key] || 0) / 100) * height;
    return `${x},${y}`;
  }).join(' ');
}

export function MarketHero({
  market,
  status,
  totalPool,
  marketHistory,
  fluctuation,
  isLoading,
}) {
  const pools = calcPools(market.yesPool, market.noPool);
  const trendPoints = (marketHistory || []).slice(-24);
  const yesTrendPath = buildTrendPath(trendPoints, 'yesPct', 100, 34);
  const noTrendPath = buildTrendPath(trendPoints, 'noPct', 100, 34);
  const poolShiftClass = fluctuation.poolShift > 0 ? 'up' : fluctuation.poolShift < 0 ? 'down' : 'flat';

  return (
    <section className="hero-card">
      <div className="hero-head">
        <div>
          <p className="eyebrow">Single Market Hero</p>
          <h2>{market.question || 'Loading market question...'}</h2>
        </div>
        <span className={`status-pill big ${status}`}>
          {formatStatus(status)}
        </span>
      </div>

      <div className="meta-grid">
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

      <div className="odds-grid">
        <article>
          <small>YES Implied Odds</small>
          <strong>{calcImpliedMultiplier(market.yesPool, totalPool)}</strong>
        </article>
        <article>
          <small>NO Implied Odds</small>
          <strong>{calcImpliedMultiplier(market.noPool, totalPool)}</strong>
        </article>
        <article>
          <small>Outcome</small>
          <strong>
            {market.resolved ? (market.outcome ? 'YES Won' : 'NO Won') : 'Not resolved'}
          </strong>
        </article>
      </div>

      <div className="fluctuation-panel">
        <div className="fluctuation-head">
          <h4>Market Fluctuation</h4>
          <small>{fluctuation?.windowLabel || 'Recent movement'}</small>
        </div>

        <div className="fluctuation-stats">
          <article className={fluctuation.yesShiftPct >= 0 ? 'up' : 'down'}>
            <small>YES Shift</small>
            <strong>{formatShift(fluctuation.yesShiftPct)}</strong>
          </article>
          <article className={fluctuation.noShiftPct >= 0 ? 'up' : 'down'}>
            <small>NO Shift</small>
            <strong>{formatShift(fluctuation.noShiftPct)}</strong>
          </article>
          <article className={poolShiftClass}>
            <small>Pool Inflow</small>
            <strong>{formatShift(fluctuation.poolShift, ` ${APP_CONFIG.currencySymbol}`)}</strong>
          </article>
        </div>

        {trendPoints.length >= 2 ? (
          <div className="trend-wrap">
            <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="trend-chart" aria-hidden="true">
              <polyline className="trend-line yes" points={yesTrendPath} />
              <polyline className="trend-line no" points={noTrendPath} />
            </svg>
            <div className="trend-legend">
              <span><i className="legend-line yes" /> YES trend</span>
              <span><i className="legend-line no" /> NO trend</span>
            </div>
          </div>
        ) : (
          <p className="subtle-text">Collecting data points for fluctuation chart...</p>
        )}
      </div>

      {isLoading && <p className="subtle-text">Refreshing on-chain market state...</p>}
    </section>
  );
}
