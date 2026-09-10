'use client';

import React, { Suspense } from 'react';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { RouteProgressBar } from '@/components/common/RouteProgressBar';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
