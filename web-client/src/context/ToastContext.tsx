"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  title?: string;
  duration?: number; // ms, default 3000ms
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const type: ToastType = options.type || 'info';
      const duration = options.duration ?? 3000;

      const newToast: ToastItem = {
        id,
        type,
        message: options.message,
        title: options.title,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', message, title }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: 'error', message, title }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', message, title }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', message, title }),
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, showToast, dismissToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Viewport Container */}
      <div
        aria-live="assertive"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              borderClass: 'border-emerald-200 bg-white text-slate-800 shadow-emerald-500/10',
              iconClass: 'text-emerald-600 bg-emerald-50',
              titleText: 'Success',
            },
            error: {
              icon: AlertCircle,
              borderClass: 'border-red-200 bg-white text-slate-800 shadow-red-500/10',
              iconClass: 'text-red-600 bg-red-50',
              titleText: 'Error',
            },
            warning: {
              icon: AlertTriangle,
              borderClass: 'border-amber-200 bg-white text-slate-800 shadow-amber-500/10',
              iconClass: 'text-amber-600 bg-amber-50',
              titleText: 'Warning',
            },
            info: {
              icon: Info,
              borderClass: 'border-blue-200 bg-white text-slate-800 shadow-blue-500/10',
              iconClass: 'text-blue-600 bg-blue-50',
              titleText: 'Information',
            },
          }[toast.type];

          const IconComponent = typeConfig.icon;

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${typeConfig.borderClass}`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${typeConfig.iconClass}`}>
                <IconComponent size={18} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                {toast.title && (
                  <p className="text-xs font-bold text-slate-900 mb-0.5">{toast.title}</p>
                )}
                <p className="text-xs font-medium text-slate-700 break-words leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const fallbackToastContext: ToastContextValue = {
  toasts: [],
  showToast: () => '',
  dismissToast: () => {},
  success: () => '',
  error: () => '',
  warning: () => '',
  info: () => '',
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    return fallbackToastContext;
  }
  return context;
}
