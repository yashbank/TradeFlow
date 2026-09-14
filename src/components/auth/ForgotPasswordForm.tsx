import { getFriendlyErrorMessage } from '@/lib/errorHandler';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { requestPasswordResetAction } from '@/actions/auth';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { CompactControlsBar } from '@/components/ui/CompactControlsBar';
import { Wrench, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export function ForgotPasswordForm() {
  const { t } = useTranslation();
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
      setSuccessMessage(getFriendlyErrorMessage(res));
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Fixed Compact Controls Bar */}
      <div className="fixed top-4 right-4 z-50">
        <CompactControlsBar />
      </div>

      <div className="flex items-center justify-between max-w-md w-full mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-black text-lg text-slate-900 dark:text-zinc-100">TradeFlow</span>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto my-auto">
        <Card className="glass-panel-elevated shadow-xl border-slate-200 dark:border-zinc-800 rounded-3xl p-2 sm:p-4">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-sky-500/25">
              <Mail className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-zinc-100">
              {t('auth.reset_password_title')}
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {t('auth.reset_password_subtitle')}
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-0">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                  {t('auth.email_label')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="dave@millerplumbing.com"
                    className="pl-10 h-12 min-h-[44px] rounded-xl text-sm bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-sm h-12 min-h-[44px] shadow-md shadow-sky-500/25 rounded-xl"
                disabled={loading}
              >
                {loading ? t('auth.sending_link') : t('auth.send_reset_link')}
              </Button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 min-h-[44px]"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                {t('auth.back_to_login')}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500 max-w-md mx-auto">
        TradeFlow Enterprise Security • Recovery links expire in 60 minutes
      </div>
    </div>
  );
}
