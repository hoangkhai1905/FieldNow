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

  const typeClasses = {
    success: 'border-success bg-success/10',
    error: 'border-danger bg-danger/10',
    warning: 'border-warning bg-warning/10',
    info: 'border-brand bg-brand/10',
  };

  const iconClasses = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const typeColors = {
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-brand',
  };

  return (
    <div
      className={`
        fixed
        bottom-6
        right-6
        max-w-sm
        rounded-lg
        border-l-4
        padding-4
        backdrop-blur-sm
        box-shadow-md
        animate-slide-in-up
        z-50
        transition-all
        duration-300
        ${typeClasses[type]}
      `}
      style={{
        animation: 'slideInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 text-lg font-bold ${typeColors[type]}`}>
          {iconClasses[type]}
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="flex-shrink-0 text-muted hover:text-ink transition-colors"
          aria-label="Close notification"
        >
          ✕
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
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
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