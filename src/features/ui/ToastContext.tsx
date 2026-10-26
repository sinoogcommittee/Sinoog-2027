import { useState, useCallback, useId, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { ToastContext, type Toast, type ToastTone } from './toastState';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const baseId = useId();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `${baseId}-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      dismiss(id);
    }, 4500);
  }, [baseId, dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <aside className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`} role="alert">
            <span className="toast__icon">
              {t.tone === 'success' && <CheckCircle size={18} />}
              {t.tone === 'error' && <AlertCircle size={18} />}
              {t.tone === 'info' && <Info size={18} />}
            </span>
            <span className="toast__message">{t.message}</span>
            <button
              type="button"
              className="toast__dismiss"
              onClick={() => dismiss(t.id)}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}
