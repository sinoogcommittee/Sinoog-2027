/**
 * Sinoog 2027 — Shared feedback / state UI components
 * Upgraded to M3 tokens and the shared Dialog primitive (P1-006).
 *
 * Exports: LoadingState, EmptyState, ErrorState, ConfirmDialog
 * Existing callers use the same props; no breaking API changes.
 */

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Dialog } from '../../components/m3/Dialog';
import { Button } from '../../components/Button';

/* ---------- LoadingState ---------- */

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="m3-state-box" role="status" aria-live="polite">
      <span className="m3-progress-circular" aria-hidden="true" />
      <p className="m3-state-box__desc">{message}</p>
    </div>
  );
}

/* ---------- EmptyState ---------- */

export function EmptyState({
  title = 'No records found',
  message = 'There are currently no items to display.',
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="m3-state-box">
      <p className="m3-state-box__title">{title}</p>
      <p className="m3-state-box__desc">{message}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

/* ---------- ErrorState ---------- */

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
    <div className="m3-state-box m3-state-box--error" role="alert">
      <span className="m3-state-box__icon" aria-hidden="true">
        <AlertCircle size={32} />
      </span>
      <p className="m3-state-box__title">{title}</p>
      <p className="m3-state-box__desc">{message}</p>
      {onRetry && (
        <Button type="button" variant="outlined" size="small" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------- ConfirmDialog ---------- */

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
  return (
    <Dialog
      open={isOpen}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button type="button" variant="text" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'filled'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Dialog>
  );
}

/* ---------- InlineMessage (new helper for inline success/info/error notices) ---------- */

export type MessageTone = 'success' | 'error' | 'info';

export function InlineMessage({
  tone = 'info',
  children,
}: {
  tone?: MessageTone;
  children: ReactNode;
}) {
  const Icon =
    tone === 'success' ? CheckCircle : tone === 'error' ? AlertCircle : Info;
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 'var(--md-sys-shape-corner-extra-small)',
        background:
          tone === 'success'
            ? 'var(--md-ext-color-success-container)'
            : tone === 'error'
              ? 'var(--md-sys-color-error-container)'
              : 'var(--md-ext-color-info-container)',
        color:
          tone === 'success'
            ? 'var(--md-ext-color-on-success-container)'
            : tone === 'error'
              ? 'var(--md-sys-color-on-error-container)'
              : 'var(--md-ext-color-on-info-container)',
        fontSize: 'var(--md-sys-typescale-body-medium-size)',
        lineHeight: 'var(--md-sys-typescale-body-medium-line)',
        margin: 0,
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
