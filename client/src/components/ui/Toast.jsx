import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

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
            let icon = <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />;
            let borderColor = 'border-indigo-500/30 bg-indigo-950/90 text-indigo-100';
            let iconBg = 'bg-indigo-500/10';

            if (t.type === 'success') {
              icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
              borderColor = 'border-emerald-500/30 bg-emerald-950/90 text-emerald-100';
              iconBg = 'bg-emerald-500/10';
            } else if (t.type === 'error') {
              icon = <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
              borderColor = 'border-red-500/40 bg-red-950/90 text-red-100';
              iconBg = 'bg-red-500/10';
            } else if (t.type === 'warning') {
              icon = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
              borderColor = 'border-amber-500/40 bg-amber-950/90 text-amber-100';
              iconBg = 'bg-amber-500/10';
            }

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium ${borderColor}`}
              >
                <div className={`p-1.5 rounded-lg ${iconBg} flex-shrink-0 mt-0.5`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0 leading-relaxed break-words py-0.5">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                  title="Dismiss"
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
