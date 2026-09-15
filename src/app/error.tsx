'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global client application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950">
      <div className="max-w-md w-full glass-panel-elevated p-8 rounded-3xl border border-rose-500/20 shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            An unexpected error occurred while loading this view. The system has automatically isolated the issue.
          </p>
          {error?.message && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] font-mono text-rose-700 dark:text-rose-300 text-left overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 shadow-md shadow-blue-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Try Again
          </Button>

          <Link href="/dashboard" className="w-full">
            <Button
              variant="outline"
              className="w-full text-xs font-bold h-10 border-slate-200 dark:border-zinc-800"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
