'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Inter, Sora } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { CompactControlsBar } from '@/components/ui/CompactControlsBar';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';

const inter = Inter({ subsets: ['latin'] });
const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

export default function MarketingLandingPage() {
  const { t } = useTranslation();

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.scroll-reveal,.scroll-reveal-left,.scroll-reveal-right,.scroll-reveal-scale').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500/30 ${inter.className} overflow-x-hidden`}>
      
      {/* FLOATING NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 dark:border-white/5 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
              <TradeFlowLogo size="md" />
            </div>
            <span className={`${sora.className} font-bold text-xl tracking-tight`}>TradeFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <CompactControlsBar />
          </div>
        </div>
      </nav>

      {/* 1. HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden hero-mesh bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center z-10">
          <h1 className={`${sora.className} text-5xl md:text-7xl font-black tracking-tighter mb-8 scroll-reveal`}>
            Dispatch Friction <ArrowRight className="inline-block w-10 h-10 md:w-16 md:h-16 text-slate-300 dark:text-slate-700 mx-2 -mt-4" /> <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500">Same-Day Cash Flow</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto scroll-reveal stagger-1">
            TradeFlow makes your service business invisible. Automate routing, eliminate paperwork, and get paid before the van leaves the driveway.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 scroll-reveal stagger-2">
            <Button size="lg" className="rounded-full h-14 px-8 text-base bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto shadow-xl shadow-indigo-500/20">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base w-full sm:w-auto border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              Watch Demo
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 scroll-reveal stagger-3">
            {[
              { label: "2,500+ Teams", icon: <Star className="w-4 h-4 text-amber-500" /> },
              { label: "<8min Dispatch", icon: <Clock className="w-4 h-4 text-sky-500" /> },
              { label: "98% CSAT", icon: <Check className="w-4 h-4 text-emerald-500" /> }
            ].map((stat, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium backdrop-blur-md stagger-${i+1}`}>
                {stat.icon}
                {stat.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. PROBLEM STATEMENT */}
      <section className="min-h-screen flex items-center justify-center py-32 relative bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal-left">
            <h2 className={`${sora.className} text-4xl md:text-5xl font-bold tracking-tight mb-6`}>
              Your dispatch board is a bottleneck.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Manual routing, lost paperwork, and disconnected systems are costing you thousands in unbillable hours.
            </p>
          </div>
          <div className="space-y-4">
            {[
              "Techs driving across town inefficiently",
              "Waiting days to send invoices",
              "Customers in the dark about ETAs"
            ].map((point, i) => (
              <div key={i} className={`flex items-start gap-4 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm scroll-reveal-right stagger-${i+1}`}>
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <p className="font-medium">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SOLUTION SHOWCASE */}
      <section className="min-h-screen flex items-center justify-center py-32 relative bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-4 order-2 md:order-1">
            {[
              "AI-optimized GPS routing",
              "One-tap digital invoicing",
              "Live Uber-style tracking links"
            ].map((point, i) => (
              <div key={i} className={`flex items-start gap-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm scroll-reveal-scale stagger-${i+1}`}>
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-medium">{point}</p>
              </div>
            ))}
          </div>
          <div className="scroll-reveal-right order-1 md:order-2">
            <h2 className={`${sora.className} text-4xl md:text-5xl font-bold tracking-tight mb-6`}>
              TradeFlow makes it invisible.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Everything syncs seamlessly from the office to the field, so you can focus on growth, not logistics.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FEATURE STRIP */}
      <section className="min-h-screen flex items-center justify-center py-32 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className={`${sora.className} text-3xl md:text-5xl font-bold tracking-tight mb-4`}>Everything you need.</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Nothing you don't. A perfectly tuned toolchain.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Navigation, title: "GPS Radar", desc: "See your whole fleet live on the map." },
              { icon: Clock, title: "Stopwatch Billing", desc: "Track every minute accurately." },
              { icon: FileText, title: "Instant Invoices", desc: "Get paid before leaving the job." },
              { icon: Smartphone, title: "Customer Portal", desc: "Client self-serve booking & updates." }
            ].map((feat, i) => (
              <div key={i} className={`p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow scroll-reveal-scale stagger-${i+1}`}>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6">
                  <feat.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-xl mb-2">{feat.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SOCIAL PROOF */}
      <section className="min-h-screen flex items-center justify-center py-32 relative bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center scroll-reveal-scale">
          <div className="flex justify-center gap-1 mb-8">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-amber-500 fill-amber-500" />)}
          </div>
          <h2 className={`${sora.className} text-3xl md:text-5xl font-medium tracking-tight mb-12 leading-tight`}>
            "We used to spend 3 hours a day just untangling the dispatch board. With TradeFlow, it manages itself. Our revenue is up 40% because we can fit in more jobs."
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="text-left">
              <div className="font-semibold text-lg">Sarah Jenkins</div>
              <div className="text-slate-500 dark:text-slate-400">Owner, Elite HVAC Services</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SIMPLE PRICING */}
      <section className="min-h-screen flex items-center justify-center py-32 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-6 w-full">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className={`${sora.className} text-3xl md:text-5xl font-bold tracking-tight mb-4`}>Simple, transparent pricing.</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Starter", price: "49", feats: ["Up to 3 techs", "Basic dispatch", "Standard support"] },
              { name: "Pro", price: "149", highlight: true, feats: ["Up to 10 techs", "AI Routing", "Priority support"] },
              { name: "Enterprise", price: "299", feats: ["Unlimited techs", "Custom API", "24/7 dedicated support"] }
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-3xl bg-white dark:bg-slate-950 border ${plan.highlight ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' : 'border-slate-200 dark:border-slate-800'} flex flex-col scroll-reveal-scale stagger-${i+1} hover:ring-2 ring-indigo-500/20 transition-all`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-medium text-xl mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-slate-500 dark:text-slate-400">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.feats.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-indigo-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-full ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white'}`}>
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA + FOOTER */}
      <section className="min-h-screen flex flex-col pt-32 relative bg-white dark:bg-slate-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center w-full scroll-reveal">
            <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
              <div className="relative z-10">
                <h2 className={`${sora.className} text-4xl md:text-6xl font-bold tracking-tight mb-8`}>
                  Ready to eliminate dispatch friction?
                </h2>
                <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-white text-indigo-600 hover:bg-slate-50">
                  Start your 14-day free trial
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="border-t border-slate-100 dark:border-slate-800 py-12 mt-20">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <TradeFlowLogo size="md" />
              <span className="font-semibold">TradeFlow © 2026</span>
            </div>
            <CompactControlsBar />
          </div>
        </footer>
      </section>

    </div>
  );
}
