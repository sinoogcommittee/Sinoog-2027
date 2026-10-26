import React from 'react';

export function LoadingState({ message = 'Loading details…' }: { message?: string }) {
  return (
    <div className="state-box state-box--loading" role="status" aria-live="polite">
      <div className="state-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({
  title = 'No records found',
  message = 'There are currently no items to display.',
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state-box state-box--empty">
      <h3 className="state-box__title">{title}</h3>
      <p className="state-box__desc">{message}</p>
      {action && <div className="state-box__action">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load content',
  message = 'An unexpected error occurred while fetching information.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-box state-box--error" role="alert">
      <h3 className="state-box__title">{title}</h3>
      <p className="state-box__desc">{message}</p>
      {onRetry && (
        <button type="button" className="button button--secondary button--sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'normal',
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'normal' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="modal-card">
        <h3 id="dialog-title">{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="button button--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${tone === 'danger' ? 'button--danger' : 'button--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

