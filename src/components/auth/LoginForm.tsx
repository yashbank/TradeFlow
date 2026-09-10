'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { loginUserAction, loginDemoAction } from '@/actions/auth';
import { Wrench, Sparkles, KeyRound } from 'lucide-react';

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginUserAction(formData);

    if (res && !res.success) {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
    }
  }

  function handleAutofillDemo() {
    setEmail('demo@tradeflow.app');
    setPassword('password123');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Wrench className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">Sign In to TradeFlow</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Access your plumbing workspace</p>
        </CardHeader>

        {/* 1-Click Demo Access Banner */}
        <div className="px-6 pb-2">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-900 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Zero-Config Demo Mode</span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              Explore all pages with pre-populated plumbing jobs, quotes, and customers without setting up a database.
            </p>
            <form action={loginDemoAction}>
              <Button
                type="submit"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
              >
                ⚡ 1-Click Instant Demo Login
              </Button>
            </form>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 font-medium">or sign in with credentials</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3 pt-0">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <button
                  type="button"
                  onClick={handleAutofillDemo}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" /> Autofill Demo Creds
                </button>
              </div>
              <Input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@tradeflow.app"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <Input
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-0.5">
              <p className="font-semibold text-slate-700">Preset Demo Credentials:</p>
              <p>Email: <code className="text-blue-700 bg-white px-1 py-0.5 rounded border border-slate-200">demo@tradeflow.app</code></p>
              <p>Password: <code className="text-blue-700 bg-white px-1 py-0.5 rounded border border-slate-200">password123</code></p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button type="submit" size="lg" className="w-full font-bold shadow-md" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                Start Free Trial
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
