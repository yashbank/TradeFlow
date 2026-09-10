'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
    loading: (title: string, message?: string, duration?: number) => string;
    dismiss: (id: string) => void;
  };
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  loading: (title: string, message?: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 3000 }: Omit<ToastItem, 'id'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newItem: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newItem]); // keep max 5 on screen

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const toastHelpers = {
    success: (title: string, message?: string, duration = 3000) =>
      showToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration = 3500) =>
      showToast({ type: 'error', title, message, duration }),
    info: (title: string, message?: string, duration = 3000) =>
      showToast({ type: 'info', title, message, duration }),
    loading: (title: string, message?: string, duration = 0) =>
      showToast({ type: 'loading', title, message, duration }),
    dismiss: dismissToast,
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        toast: toastHelpers,
        ...toastHelpers,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noopHelpers = {
      success: () => '',
      error: () => '',
      info: () => '',
      loading: () => '',
      dismiss: () => {},
    };
    return {
      toasts: [],
      showToast: () => '',
      dismissToast: () => {},
      toast: noopHelpers,
      ...noopHelpers,
    };
  }
  return ctx;
}
