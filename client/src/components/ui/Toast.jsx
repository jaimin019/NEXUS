import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconColor: '#D4B896',
    bg: 'rgba(107,143,78,0.15)',
    border: 'rgba(107,143,78,0.3)',
    text: 'var(--text)',
  },
  error: {
    icon: XCircle,
    iconColor: '#B87070',
    bg: 'rgba(194,59,46,0.15)',
    border: 'rgba(194,59,46,0.3)',
    text: 'var(--text)',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: '#C4A882',
    bg: 'rgba(196,124,47,0.15)',
    border: 'rgba(196,124,47,0.3)',
    text: 'var(--text)',
  },
  info: {
    icon: Info,
    iconColor: '#C49A3C',
    bg: 'rgba(196,154,60,0.15)',
    border: 'rgba(196,154,60,0.3)',
    text: 'var(--text)',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = React.useMemo(() => ({
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    dismiss: (id) => removeToast(id),
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Floating Container - Top Right Stacked */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
            const Icon = style.icon;

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  color: style.text,
                }}
              >
                <div
                  className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
                  style={{ background: `${style.border}` }}
                >
                  <Icon className="w-4 h-4" style={{ color: style.iconColor }} />
                </div>
                <div className="flex-1 min-w-0 leading-relaxed break-words py-0.5">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg transition-colors flex-shrink-0 mt-0.5"
                  title="Dismiss"
                  style={{ color: 'var(--text-faint)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
