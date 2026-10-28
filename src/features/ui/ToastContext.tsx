/**
 * Sinoog 2027 — Toast / Snackbar provider (P1-006 M3 upgrade)
 *
 * Renders a bottom-centre snackbar region using M3 tokens.
 * API is unchanged: toast(message, tone?) / dismiss(id).
 */

import { useState, useCallback, useId, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { ToastContext, type Toast, type ToastTone } from './toastState';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const baseId = useId();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = `${baseId}-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [baseId, dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* M3 Snackbar region — bottom-centre, safe-area aware */}
      <aside className="m3-snackbar-region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`m3-snackbar m3-snackbar--${t.tone}`} role="alert">
            <span className="m3-snackbar__icon" aria-hidden="true">
              {t.tone === 'success' && <CheckCircle size={20} />}
              {t.tone === 'error' && <AlertCircle size={20} />}
              {t.tone === 'info' && <Info size={20} />}
            </span>
            <span className="m3-snackbar__message">{t.message}</span>
            <button
              type="button"
              className="m3-snackbar__dismiss"
              onClick={() => dismiss(t.id)}
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}
