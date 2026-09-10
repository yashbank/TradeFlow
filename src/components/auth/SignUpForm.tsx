'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { registerUserAction } from '@/actions/auth';
import { Wrench, CheckCircle2 } from 'lucide-react';

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await registerUserAction(formData);

    // If redirected, this line won't run. If error returned:
    if (res && !res.success) {
      setError(res.error || 'Registration failed');
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
          <CardTitle className="text-2xl font-black text-slate-900 dark:text-zinc-100">Create TradeFlow Account</CardTitle>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Start your 14-day full access free trial • No credit card required</p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3.5 pt-0">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Your Full Name *</label>
              <Input name="fullName" required placeholder="Dave Miller" className="h-11" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Plumbing Business Name *</label>
              <Input name="businessName" required placeholder="Dave's Fast Plumbing" className="h-11" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Work Email Address *</label>
              <Input type="email" name="email" required placeholder="dave@davesplumbing.com" className="h-11" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Password *</label>
              <Input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="Min 8 chars, 1 number, 1 symbol"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Country</label>
                <select
                  name="country"
                  className="w-full h-11 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Currency</label>
                <select
                  name="currency"
                  className="w-full h-11 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-700/80 flex items-center gap-2 text-slate-600 dark:text-zinc-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full access to quotes, jobs, invoicing, and dispatching</span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full font-bold shadow-md min-h-[44px]"
              disabled={loading}
            >
              {loading ? 'Creating Workspace...' : 'Start 14-Day Free Trial'}
            </Button>
            <p className="text-xs text-slate-500 dark:text-zinc-400 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
