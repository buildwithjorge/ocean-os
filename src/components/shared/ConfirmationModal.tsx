/**
 * Module: ConfirmationModal
 * Purpose: Project runtime and documentation surface.
 */
type ConfirmationModalProps = {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({ open, title, text, confirmLabel, onConfirm, onCancel }: ConfirmationModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card">
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
