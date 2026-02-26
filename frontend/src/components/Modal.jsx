export function Modal({ open, title, children, onCancel, onConfirm, confirmLabel = 'Confirm' }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-window" role="dialog" aria-modal="true" aria-label={title}>
        <h4>{title}</h4>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
