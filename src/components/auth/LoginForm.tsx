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
      {/* Left Column: 4K Photographic Architectural Craftsmanship Showcase */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative p-12 flex-col justify-between overflow-hidden text-white border-r border-slate-800">
        {/* 4K High-Definition Master Trade & Architecture Background */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105 hover:scale-100"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        {/* Dark Film Grain & Fluid Gradient Vignette */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40 backdrop-blur-[2px]" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
            <TradeFlowLogo size="md" />
          </div>
          <div>
            <span className="font-black text-2xl tracking-tight text-white">TradeFlow</span>
          </div>
        </div>

        {/* Minimal Hero Statement */}
        <div className="relative z-10 space-y-4 max-w-lg">
          <h2 className="text-3xl xl:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
            The Operating System for Master Trades.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed drop-shadow-sm font-normal">
            Automated scheduling, live van tracking, digital sign-off, and same-day payouts in one unified platform.
          </p>
        </div>

        {/* Minimal Footer */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/15 pt-4">
          <span>Enterprise-Grade Security</span>
          <span>Instant Settlement Engine</span>
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
