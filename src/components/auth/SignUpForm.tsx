'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerUserAction } from '@/actions/auth';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { CompactControlsBar } from '@/components/ui/CompactControlsBar';
import {
  Wrench,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function SignUpForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await registerUserAction(formData);

    if (res && !res.success) {
      setError(res.error || 'Registration failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Left Column: Brand Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative p-12 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-zinc-900 to-indigo-950 text-white border-r border-slate-800">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl tracking-tight text-white">TradeFlow</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>14-Day Full Access Trial</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
            Launch Your Modern Plumbing Empire Today.
          </h2>

          <div className="space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No credit card required to start</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full access to Live GPS Fleet Radar & Stopwatch</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant 1-click demo data population for testing</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500 border-t border-white/10 pt-6">
          © 2026 TradeFlow Inc. High-velocity trade field management.
        </div>
      </div>

      {/* Right Column: Sign Up Form */}
      <div className="flex-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
        {/* Fixed Compact Controls Bar */}
        <div className="fixed top-4 right-4 z-50">
          <CompactControlsBar />
        </div>

        <div className="flex items-center justify-between w-full mb-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-black text-lg text-slate-900 dark:text-zinc-100">TradeFlow</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto space-y-5">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
              {t('auth.signup_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              {t('auth.signup_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {t('auth.full_name')} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  name="fullName"
                  required
                  placeholder="Dave Miller"
                  className="pl-10 h-11 min-h-[44px] rounded-xl text-sm bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {t('auth.company_name')} *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  name="businessName"
                  required
                  placeholder="Miller Master Plumbing & Mechanical"
                  className="pl-10 h-11 min-h-[44px] rounded-xl text-sm bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {t('auth.email_label')} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  name="email"
                  required
                  placeholder="dave@millerplumbing.com"
                  className="pl-10 h-11 min-h-[44px] rounded-xl text-sm bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                {t('auth.password_label')} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="pl-10 h-11 min-h-[44px] rounded-xl text-sm bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Country</label>
                <select
                  name="country"
                  className="w-full h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 px-3 text-xs font-bold focus:ring-2 focus:ring-sky-500"
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">Currency</label>
                <select
                  name="currency"
                  className="w-full h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 px-3 text-xs font-bold focus:ring-2 focus:ring-sky-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-sm h-12 min-h-[44px] shadow-md shadow-sky-500/25 rounded-xl mt-2 transition-all active:scale-[0.98]"
            >
              {loading ? t('auth.creating_account') : t('auth.create_account_btn')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('auth.have_account')}{' '}
              <Link
                href="/login"
                className="text-sky-600 dark:text-sky-400 font-bold hover:underline min-h-[44px] inline-flex items-center"
              >
                {t('auth.sign_in_btn')}
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 dark:text-zinc-500 mt-6">
          By registering, you agree to the Terms of Service & Privacy Policy.
        </div>
      </div>
    </div>
  );
}
