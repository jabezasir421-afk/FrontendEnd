import React from 'react';
import { useToast } from '../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '24rem',
        width: '100%',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-label="Notification Toasts"
    >
      {toasts.map((toast) => {
        const borderIndicator = toast.type === 'error'
          ? '4px solid var(--red)'
          : toast.type === 'success'
          ? '4px solid #16A34A'
          : '4px solid var(--black)';

        return (
          <div
            key={toast.id}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--black)',
              borderLeft: borderIndicator,
              padding: '1rem 1.25rem',
              pointerEvents: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              position: 'relative',
            }}
            role="status"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
              <span className="eyebrow" style={{ fontSize: '0.7rem', margin: 0 }}>
                {toast.type === 'error' ? 'SYSTEM ALERT' : toast.type === 'success' ? 'TRANSACTION CONFIRMED' : 'TELEMETRY DISPATCH'}
              </span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--black)',
                  padding: 0,
                  lineHeight: 1,
                }}
                aria-label="Dismiss toast notification"
              >
                ×
              </button>
            </div>

            <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.25rem 0', textTransform: 'none', letterSpacing: 'normal' }}>
              {toast.title}
            </h4>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              {toast.message}
            </p>
          </div>
        );
      })}
    </div>
  );
};
