'use client';

import React, { Suspense } from 'react';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { CurrencyProvider } from '@/lib/currency/CurrencyContext';
import { ToastProvider } from '@/lib/toast/ToastContext';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { RouteProgressBar } from '@/components/common/RouteProgressBar';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <RouteProgressBar />
            </Suspense>
            <ToastContainer />
            {children}
          </ToastProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
