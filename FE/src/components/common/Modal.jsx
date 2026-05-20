import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const variantStyles = {
  info: {
    accent: '#F59E0B',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  success: {
    accent: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  warning: {
    accent: '#F59E0B',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  error: {
    accent: '#f43f5e',
    accentBg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.25)',
  },
};

const Modal = ({
  isOpen,
  title,
  description,
  icon: Icon,
  variant = 'info',
  confirmText = 'XÁC NHẬN',
  cancelText = 'HỦY',
  onConfirm,
  onClose,
  actions,
  children,
}) => {
  const colors = variantStyles[variant] || variantStyles.info;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative w-full max-w-[500px] rounded-[32px] border bg-neutral-950/95 p-6 md:p-10 text-center shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
            style={{ borderColor: colors.border }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:text-white"
              aria-label="Đóng modal"
            >
              <X size={18} />
            </button>

            {Icon && (
              <div
                className="mx-auto mb-6 flex h-[92px] w-[92px] items-center justify-center rounded-full border"
                style={{ background: colors.accentBg, borderColor: colors.border }}
              >
                <Icon size={44} color={colors.accent} />
              </div>
            )}

            {title && (
              <h2 className="m-0 text-2xl md:text-3xl font-black uppercase tracking-tight text-white break-words">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-4 m-0 text-sm md:text-base leading-relaxed text-slate-400 break-words">
                {description}
              </p>
            )}

            {children}

            {actions ? (
              <div className="mt-8">{actions}</div>
            ) : onConfirm ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 rounded-2xl border-none px-5 py-4 text-sm font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
                  style={{ background: colors.accent }}
                >
                  {confirmText}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-white/10"
                >
                  {cancelText}
                </button>
              </div>
            ) : (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-2xl border-none px-5 py-4 text-sm font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
                  style={{ background: colors.accent }}
                >
                  ĐÓNG
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;