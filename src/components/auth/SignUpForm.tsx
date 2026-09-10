'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { registerUserAction } from '@/actions/auth';
import { Wrench } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2">
            <Wrench className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">Create TradeFlow Account</CardTitle>
          <p className="text-xs text-slate-500 mt-1">Start your 14-day full access free trial</p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Your Full Name *</label>
              <Input name="fullName" required placeholder="Dave Miller" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Plumbing Business Name *</label>
              <Input name="businessName" required placeholder="Dave's Fast Plumbing" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Work Email Address *</label>
              <Input type="email" name="email" required placeholder="dave@davesplumbing.com" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password *</label>
              <Input
                type="password"
                name="password"
                required
                placeholder="Min 8 chars, 1 number, 1 symbol"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Country</label>
                <select
                  name="country"
                  className="w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Currency</label>
                <select
                  name="currency"
                  className="w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button type="submit" size="lg" className="w-full font-bold shadow-md" disabled={loading}>
              {loading ? 'Creating Workspace...' : 'Start 14-Day Free Trial'}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
