import { useMemo, useState } from 'react';
import { APP_CONFIG } from '../config';
import { formatDateTime, formatToken } from '../utils/format';
import { Modal } from './Modal';

export function OwnerPanel({
  isOwner,
  status,
  market,
  wallet,
  totalPool,
  onResolve,
  isActionRunning,
}) {
  const [pendingOutcome, setPendingOutcome] = useState(null);
  const [activeOutcome, setActiveOutcome] = useState(null);

  const resolutionLockedReason = useMemo(() => {
    if (!wallet.isConnected) return 'Connect owner wallet to resolve.';
    if (!wallet.isCorrectNetwork) return 'Switch to the correct network to resolve.';
    if (status === 'open') return `Resolution opens after deadline (${formatDateTime(market.deadline)}).`;
    if (status === 'resolved') return 'Market is already resolved.';
    return '';
  }, [market.deadline, status, wallet.isConnected, wallet.isCorrectNetwork]);

  if (!isOwner) return null;

  const canResolve = !resolutionLockedReason && !isActionRunning;

  const confirmResolve = async () => {
    const outcome = pendingOutcome;
    setPendingOutcome(null);
    if (outcome === null) return;
    setActiveOutcome(outcome);
    try {
      await onResolve(outcome);
    } finally {
      setActiveOutcome(null);
    }
  };

  const isDeadlinePassed = Number(market.deadline || 0n) <= Math.floor(Date.now() / 1000);
  const deadlineLabel = isDeadlinePassed ? 'Deadline passed' : 'Deadline not reached';
  const outcomeLabel = market.resolved ? (market.outcome ? 'YES won' : 'NO won') : 'Not resolved';

  return (
    <>
      <section className="card owner">
        <h3>Admin Control Center</h3>
        <p className="subtle-text">Owner-only controls and live market execution state.</p>

        <div className="admin-grid">
          <article>
            <small>Market Status</small>
            <strong>{status === 'open' ? 'Open' : status === 'resolved' ? 'Resolved' : 'Closed'}</strong>
          </article>
          <article>
            <small>Total Pool</small>
            <strong>{formatToken(totalPool)} {APP_CONFIG.currencySymbol}</strong>
          </article>
          <article>
            <small>YES Pool</small>
            <strong>{formatToken(market.yesPool)} {APP_CONFIG.currencySymbol}</strong>
          </article>
          <article>
            <small>NO Pool</small>
            <strong>{formatToken(market.noPool)} {APP_CONFIG.currencySymbol}</strong>
          </article>
          <article>
            <small>Deadline Status</small>
            <strong>{deadlineLabel}</strong>
          </article>
          <article>
            <small>Outcome</small>
            <strong>{outcomeLabel}</strong>
          </article>
        </div>

        <div className="owner-actions">
          <button
            type="button"
            className="btn yes"
            disabled={!canResolve}
            onClick={() => setPendingOutcome(true)}
          >
            {isActionRunning && activeOutcome === true ? (
              <span className="btn-with-spinner"><span className="spinner tiny" /> Resolving YES...</span>
            ) : (
              'Resolve YES'
            )}
          </button>
          <button
            type="button"
            className="btn no"
            disabled={!canResolve}
            onClick={() => setPendingOutcome(false)}
          >
            {isActionRunning && activeOutcome === false ? (
              <span className="btn-with-spinner"><span className="spinner tiny" /> Resolving NO...</span>
            ) : (
              'Resolve NO'
            )}
          </button>
        </div>

        {resolutionLockedReason && <div className="notice">{resolutionLockedReason}</div>}
      </section>

      <Modal
        open={pendingOutcome !== null}
        title="Confirm Market Resolution"
        onCancel={() => setPendingOutcome(null)}
        onConfirm={confirmResolve}
        confirmLabel="Confirm Resolution"
      >
        <p>
          You are about to finalize the market as <strong>{pendingOutcome ? 'YES won' : 'NO won'}</strong>.
        </p>
        <p>This action is irreversible.</p>
      </Modal>
    </>
  );
}
