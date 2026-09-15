'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { loginUserAction } from '@/actions/auth';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';
import { CompactControlsBar } from '@/components/ui/CompactControlsBar';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export function LoginForm() {
  const { t } = useTranslation();
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
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Left Column: Luxury Ambient Brand Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative p-12 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-zinc-900 to-sky-950 text-white border-r border-slate-800">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
            <TradeFlowLogo size="md" />
          </div>
          <div>
            <span className="font-black text-2xl tracking-tight text-white">TradeFlow</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Enterprise OS
            </span>
          </div>
        </div>

        {/* Centerpiece: Real-time Telemetry Showcase */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Velocity Dispatch Telemetry</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
            Turn Dispatch Friction into Same-Day Cash Flow.
          </h2>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Real-time GPS Van Radar</span>
                <span className="text-zinc-400">Zero phone calls to locate nearby technicians</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">15-Minute Stopwatch Billing</span>
                <span className="text-zinc-400">Accurate labor capture with customer signature on glass</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-500 flex items-center justify-between border-t border-white/10 pt-6">
          <span>Trusted by 2,500+ master trades globally</span>
          <span>SOC-2 Type II Certified Security</span>
        </div>
      </div>

      {/* Right Column: Sign In Form Card */}
      <div className="flex-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12">
        {/* Fixed Compact Controls Bar */}
        <div className="fixed top-4 right-4 z-50">
          <CompactControlsBar />
        </div>

        {/* Top Controls Bar */}
        <div className="flex items-center justify-between w-full mb-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <TradeFlowLogo size="md" />
            </div>
            <span className="font-black text-lg text-slate-900 dark:text-zinc-100">TradeFlow</span>
          </Link>
        </div>

        {/* Main Form Container */}
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('auth.login_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              {t('auth.login_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900 animate-in fade-in duration-150">
                {error}
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
                  placeholder="master@tradeflow.com"
                  className="pl-10 h-12 min-h-[44px] rounded-xl text-sm bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {t('auth.password_label')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline min-h-[44px] flex items-center"
                >
                  {t('auth.forgot_password')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10 h-12 min-h-[44px] rounded-xl text-sm bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-sm h-12 min-h-[44px] shadow-md shadow-sky-500/25 rounded-xl transition-all active:scale-[0.98]"
            >
              {loading ? t('auth.signing_in') : t('auth.sign_in_btn')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('auth.no_account')}{' '}
              <Link
                href="/signup"
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline min-h-[44px] inline-flex items-center"
              >
                {t('auth.create_account')}
              </Link>
            </p>
          </div>
        </div>

        {/* Minimal Footnote */}
        <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500 mt-6">
          TradeFlow Secure Authentication • Encrypted via TLS 1.3
        </div>
      </div>
    </div>
  );
}
