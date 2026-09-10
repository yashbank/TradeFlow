import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'TradeFlow — The 90-Second Quote-to-Invoice App for Plumbers',
  description: 'Streamlined mobile-first FSM for plumbing businesses: Customer -> Quote -> Job -> Invoice -> Payment.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased selection:bg-blue-500 selection:text-white">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
