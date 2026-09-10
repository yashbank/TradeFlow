import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  ArrowRight,
  CheckCircle2,
  FileText,
  CalendarCheck2,
  Receipt,
  DollarSign,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-xl tracking-tight">TradeFlow</span>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-semibold shadow-sm">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Built exclusively for plumbing businesses with 1–10 trucks
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
            The 90-Second <br />
            <span className="text-blue-600">Quote-to-Invoice</span> App
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
            Create professional quotes from your truck, convert them into scheduled jobs with 1 tap, and get paid faster without duplicate data entry.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base font-bold shadow-md h-12 px-8">
                Start 14-Day Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-12 px-8">
                Existing Customer Login
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            No credit card required • Instant setup in under 2 minutes • Cancel anytime
          </p>
        </section>

        {/* 5-Step Pipeline Graphic */}
        <section className="py-12 bg-white border-y border-slate-200 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-8">
              The Frictionless Plumbing Workflow
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center space-y-2">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900">1. Customer</span>
                <p className="text-xs text-slate-500">Fast mobile contact & address lookup</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center space-y-2">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900">2. Quote</span>
                <p className="text-xs text-slate-500">Tap to approve via customer SMS/link</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center space-y-2">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900">3. Job</span>
                <p className="text-xs text-slate-500">1-click conversion & dispatch</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center space-y-2">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900">4. Invoice</span>
                <p className="text-xs text-slate-500">Auto-drafted upon job completion</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center space-y-2 col-span-2 sm:col-span-1">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900">5. Payment</span>
                <p className="text-xs text-slate-500">Record card/cash & instant receipt</p>
              </div>
            </div>
          </div>
        </section>

        {/* Transparent Pricing Card */}
        <section className="py-16 px-4 sm:px-6 max-w-xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-black text-slate-900">Simple, Transparent Pricing</h2>
          <p className="text-sm text-slate-600">
            Everything you need to run your plumbing business. No per-user penalties or hidden fees.
          </p>

          <div className="bg-white rounded-2xl p-8 border-2 border-blue-600 shadow-xl space-y-6 text-left relative overflow-hidden">
            <div className="bg-blue-600 text-white text-[11px] uppercase tracking-wider font-bold py-1 px-4 absolute top-0 right-0 rounded-bl-lg">
              Starter Plan
            </div>

            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-black text-slate-900">$39</span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Full access for up to 3 team members</p>
            </div>

            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                Unlimited Customers & Service Addresses
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                Fast Quote Builder with 1-Click Approval Links
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                Quote-to-Job & Job-to-Invoice 1-Click Conversion
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                Mobile Technician Job Dispatch & Field Notes
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                Offline Payment Tracking (Card, Cash, Check, Wire)
              </li>
              <li className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                Real-Time Revenue & Win Rate Dashboard
              </li>
            </ul>

            <Link href="/signup" className="block">
              <Button size="lg" className="w-full text-base font-bold shadow-md h-12">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 text-center text-xs text-slate-400 space-y-2">
        <p>© 2026 TradeFlow SaaS. Engineered for Trade Professionals in the US, UK, and Australia.</p>
        <p>Zero bloat. Built for mobile speed.</p>
      </footer>
    </div>
  );
}
