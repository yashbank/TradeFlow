'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Shell runtime exception:', error);
  }, [error]);

  return (
    <div className="p-8 max-w-xl mx-auto my-12 glass-panel-elevated rounded-3xl border border-amber-500/30 text-center space-y-6 shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100">
          Dashboard View Interrupted
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          We encountered an issue rendering this section of your workspace. Your operational data is safe in the database.
        </p>
        {error?.message && (
          <p className="text-[11px] font-mono text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => reset()}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-10 px-5 shadow-md shadow-sky-500/20"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Reload Component
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" className="text-xs font-bold h-10 px-5">
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
            Reset Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
