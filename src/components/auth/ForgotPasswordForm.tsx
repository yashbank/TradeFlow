'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { requestPasswordResetAction } from '@/actions/auth';
import { Wrench, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const res = await requestPasswordResetAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to send reset email.');
    } else {
      setSuccessMessage(res.message || 'Password reset link sent! Check your inbox.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Wrench className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">Reset Password</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Enter your email and we&apos;ll send you a recovery link
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-md border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Account Email Address
              </label>
              <Input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="name@business.com"
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
              {loading ? 'Sending Recovery Link...' : 'Send Recovery Link'}
            </Button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
