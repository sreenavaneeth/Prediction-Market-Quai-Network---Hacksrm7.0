import { explorerTxUrl, formatDateTime } from '../utils/format';

export function TxFeed({
  transactions,
  isLoading = false,
  onRefresh,
  lastSyncedAt = 0,
}) {
  return (
    <section className="card">
      <div className="panel-head">
        <h3>Transaction Feed</h3>
        <button
          type="button"
          className="btn ghost"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Syncing...' : 'Sync'}
        </button>
      </div>
      <p className="subtle-text">Recent wallet actions with explorer links.</p>
      {lastSyncedAt > 0 && (
        <p className="subtle-text">Last sync: {formatDateTime(Math.floor(lastSyncedAt / 1000))}</p>
      )}

      {!transactions.length && (
        <div className="notice">No on-chain transactions found in recent blocks.</div>
      )}

      <div className="tx-list">
        {transactions.map((tx) => (
          <article key={tx.hash} className="tx-item">
            <div>
              <strong>{tx.label}</strong>
              <small>{formatDateTime(Math.floor(tx.createdAt / 1000))}</small>
            </div>
            <div className="tx-meta">
              <span className={`status-pill ${tx.status === 'confirmed' ? 'ok' : 'pending'}`}>
                {tx.status}
              </span>
              <span className={`status-pill ${tx.source === 'chain' ? 'open' : 'pending'}`}>
                {tx.source || 'session'}
              </span>
              <a href={explorerTxUrl(tx.hash)} target="_blank" rel="noreferrer">
                {tx.hash.slice(0, 10)}...
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
