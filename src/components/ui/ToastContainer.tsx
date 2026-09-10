'use client';

import React from 'react';
import { useToast, type ToastType } from '@/lib/toast/ToastContext';
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  function getToastStyle(type: ToastType) {
    switch (type) {
      case 'success':
        return {
          container:
            'bg-white/95 dark:bg-zinc-900/95 border-emerald-500/40 text-slate-900 dark:text-zinc-100 shadow-xl shadow-emerald-500/10',
          iconContainer: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
          icon: CheckCircle2,
          progressColor: 'bg-emerald-500',
        };
      case 'error':
        return {
          container:
            'bg-white/95 dark:bg-zinc-900/95 border-rose-500/40 text-slate-900 dark:text-zinc-100 shadow-xl shadow-rose-500/10',
          iconContainer: 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400',
          icon: AlertCircle,
          progressColor: 'bg-rose-500',
        };
      case 'loading':
        return {
          container:
            'bg-white/95 dark:bg-zinc-900/95 border-blue-500/40 text-slate-900 dark:text-zinc-100 shadow-xl shadow-blue-500/10',
          iconContainer: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400',
          icon: Loader2,
          progressColor: 'bg-blue-500',
        };
      case 'info':
      default:
        return {
          container:
            'bg-white/95 dark:bg-zinc-900/95 border-blue-500/40 text-slate-900 dark:text-zinc-100 shadow-xl shadow-blue-500/10',
          iconContainer: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400',
          icon: Info,
          progressColor: 'bg-blue-500',
        };
    }
  }

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        const Icon = style.icon;
        const isLoading = toast.type === 'loading';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-2xl border backdrop-blur-xl p-3.5 flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-right-5 fade-in relative overflow-hidden group ${style.container}`}
          >
            {/* Countdown animation bar for 3s auto-dismiss */}
            {toast.duration && toast.duration > 0 && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${style.progressColor} opacity-70`}
                style={{
                  animation: `shrinkWidth ${toast.duration}ms linear forwards`,
                }}
              />
            )}

            <div
              className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${style.iconContainer}`}
            >
              <Icon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <p className="font-bold text-xs leading-tight tracking-tight text-slate-900 dark:text-zinc-100">
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
