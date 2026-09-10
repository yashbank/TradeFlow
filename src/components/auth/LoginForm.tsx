'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { loginUserAction } from '@/actions/auth';
import { Wrench } from 'lucide-react';

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginUserAction(formData);

    if (res && !res.success) {
      setError(res.error || 'Invalid email or password.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-md dark:bg-zinc-900 dark:border-zinc-800">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Wrench className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 dark:text-zinc-100">Sign In to TradeFlow</CardTitle>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Access your professional plumbing workspace</p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Email Address</label>
              <Input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="name@business.com"
                className="h-11"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full font-bold shadow-md min-h-[44px]"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <p className="text-xs text-slate-500 dark:text-zinc-400 text-center">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Start 14-Day Free Trial
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
