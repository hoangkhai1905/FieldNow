/**
 * Toast Component
 * 
 * Sliding notification with different types
 * Auto-dismisses after 3 seconds
 * 
 * Usage:
 * <Toast message="Success!" type="success" />
 * <Toast message="Error occurred" type="error" onClose={handleClose} />
 */

import React, { useEffect, useState } from 'react';

export const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  onClose = null,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === null) return; // Manual close only

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const iconClasses = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: '#10b981',
    error: '#f43f5e',
    warning: '#F59E0B',
    info: '#3b82f6',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5000,
        maxWidth: 'min(520px, calc(100vw - 32px))',
        padding: '15px 22px',
        borderRadius: '999px',
        background: colors[type] || colors.info,
        color: '#fff',
        fontWeight: 850,
        boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        pointerEvents: 'auto',
        animation: 'slideInDown 0.25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: 950, lineHeight: 1 }}>
          {iconClasses[type]}
        </div>

        <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{message}</p>

        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          style={{ marginLeft: '4px', border: 'none', background: 'rgba(255,255,255,0.18)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Toast Context Hook - For using Toast globally
 * 
 * Usage:
 * import { useToast } from '@/context/ToastContext';
 * 
 * const { showToast } = useToast();
 * showToast('Success!', 'success');
 */

export const ToastContainer = ({ toasts = [] }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 5000, pointerEvents: 'none' }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={toast.onClose}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
