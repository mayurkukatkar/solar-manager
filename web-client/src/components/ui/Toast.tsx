"use client";

import React from 'react';
import { useToast, ToastProvider, ToastType, ToastOptions, ToastItem } from '@/context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export { useToast, ToastProvider };
export type { ToastType, ToastOptions, ToastItem };

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
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
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${typeConfig.borderClass}`}
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
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default Toast;
