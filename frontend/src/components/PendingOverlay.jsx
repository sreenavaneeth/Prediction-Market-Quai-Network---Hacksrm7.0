export function PendingOverlay({ active, label }) {
  if (!active) return null;

  return (
    <div className="pending-overlay" role="status" aria-live="polite">
      <div className="pending-card">
        <div className="spinner" />
        <p>{label || 'Waiting for transaction confirmation...'}</p>
      </div>
    </div>
  );
}
