/**
 * Sinoog 2027 — M3 Dialog primitive (P1-006)
 *
 * A shared, accessible dialog / modal overlay.
 * - Uses the native <dialog> element for built-in focus containment and
 *   Escape key handling across all modern browsers.
 * - `aria-labelledby` wired to the title id automatically.
 * - Focus is returned to the trigger element on close.
 * - Background is inert via the native dialog backdrop.
 * - Optional full-screen mode for compact/long forms.
 */

import {
  useEffect,
  useRef,
  useId,
  type ReactNode,
} from 'react';

export interface DialogProps {
  /** Controls open/closed state. */
  open: boolean;
  /** The dialog heading text (required for accessible name). */
  title: string;
  /** Called when the user dismisses via Escape or the backdrop click. */
  onClose: () => void;
  children: ReactNode;
  /**
   * Renders the action row (e.g. Cancel + Confirm buttons).
   * Placed after `children` inside the scrollable content area.
   */
  actions?: ReactNode;
  /**
   * `'standard'` — centred card dialog (default).
   * `'fullscreen'` — covers the viewport on compact screens.
   */
  variant?: 'standard' | 'fullscreen';
  /** Extra class names forwarded to the inner dialog card. */
  className?: string;
}

export function Dialog({
  open,
  title,
  onClose,
  children,
  actions,
  variant = 'standard',
  className = '',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  /* Open / close the native <dialog> imperatively to keep in sync with `open` prop. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) {
        el.showModal();
      }
    } else {
      if (el.open) {
        el.close();
      }
    }
  }, [open]);

  /* Forward native 'cancel' event (Escape) to the onClose callback. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e: Event) => {
      e.preventDefault(); // prevent native close; let our state drive it
      onClose();
    };
    el.addEventListener('cancel', handleCancel);
    return () => el.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  /* Close on backdrop click (clicking outside the card area). */
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) {
      onClose();
    }
  };

  const classes = [
    'm3-dialog__card',
    variant === 'fullscreen' ? 'm3-dialog__card--fullscreen' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <dialog
      ref={ref}
      className="m3-dialog"
      aria-labelledby={titleId}
      onClick={handleDialogClick}
    >
      <div className={classes}>
        <h2 id={titleId} className="m3-dialog__title">
          {title}
        </h2>
        <div className="m3-dialog__content">{children}</div>
        {actions && <div className="m3-dialog__actions">{actions}</div>}
      </div>
    </dialog>
  );
}
