'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Inter, Sora } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Navigation, Clock, FileText, Smartphone, Star } from 'lucide-react';
import { CompactControlsBar } from '@/components/ui/CompactControlsBar';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TradeFlowLogo } from '@/components/common/TradeFlowLogo';

const inter = Inter({ subsets: ['latin'] });
const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });

export default function MarketingLandingPage() {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .stagger-group > *').forEach(el => obs.observe(el));
    
    // Parallax effect for hero mesh
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-500/30 ${inter.className} overflow-x-hidden`}>
      
      {/* FLOATING NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/20 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
              <TradeFlowLogo size="sm" />
            </div>
            <span className={`${sora.className} font-semibold text-lg tracking-tight`}>TradeFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative group">
              Sign In
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-slate-900 dark:bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
            <div className="hidden sm:block">
              <CompactControlsBar />
            </div>
          </div>
        </div>
      </nav>

      {/* 1. HERO - Apple/Linear Style */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div ref={heroRef} className="absolute inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40" style={{ transition: 'transform 0.1s ease-out' }}>
          <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-indigo-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[30%] right-[20%] w-96 h-96 bg-sky-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[20%] left-[40%] w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center z-10 flex flex-col items-center">
          <div className="scroll-reveal mb-6 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-sm font-medium inline-flex items-center gap-2 luxury-card-hover shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            TradeFlow 2.0 is now live
          </div>
          
          <h1 className={`${sora.className} text-6xl md:text-8xl font-bold tracking-tighter mb-8 scroll-reveal stagger-1 leading-[1.1]`}>
            Dispatch Friction <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">Eliminated.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-10 max-w-3xl mx-auto scroll-reveal stagger-2 font-light leading-relaxed">
            Automate routing, digitize paperwork, and secure payments before the van leaves the driveway. The operating system for modern field service.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 scroll-reveal stagger-3 w-full sm:w-auto">
            <Button size="lg" className="rounded-full h-14 px-8 text-base bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 w-full sm:w-auto shadow-xl transition-all hover:scale-105 active:scale-95 group">
              Start Free Trial <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base w-full sm:w-auto border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95">
              Book a Demo
            </Button>
          </div>
          
          {/* Glass Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl stagger-group">
            {[
              { label: "Teams", value: "2.5k+", suffix: "Active" },
              { label: "Dispatch", value: "<8", suffix: "Mins" },
              { label: "CSAT", value: "98", suffix: "%" },
              { label: "Uptime", value: "99.9", suffix: "%" }
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/60 backdrop-blur-xl shadow-lg luxury-card-hover scroll-reveal-scale stagger-${i+1} glass-panel`}>
                <div className="text-3xl font-bold tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">{stat.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. THE STORYLINE */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="scroll-reveal-left order-2 lg:order-1">
              <div className="relative rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-2 shadow-2xl luxury-card-hover">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                   {/* Abstract Dashboard UI Representation */}
                   <div className="absolute inset-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm flex flex-col">
                     <div className="h-10 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-400"></div>
                       <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                       <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                     </div>
                     <div className="flex-1 p-4 flex gap-4">
                       <div className="w-1/3 h-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 space-y-3">
                         <div className="w-full h-8 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                         <div className="w-full h-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse animation-delay-200"></div>
                         <div className="w-full h-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse animation-delay-400"></div>
                       </div>
                       <div className="w-2/3 h-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
                         <div className="w-1/3 h-6 rounded bg-slate-200 dark:bg-slate-800 mb-6"></div>
                         <div className="w-full h-32 rounded-lg bg-gradient-to-r from-sky-400/20 to-indigo-500/20 mb-4"></div>
                         <div className="flex gap-4">
                            <div className="flex-1 h-12 rounded bg-slate-200 dark:bg-slate-800"></div>
                            <div className="flex-1 h-12 rounded bg-slate-200 dark:bg-slate-800"></div>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="scroll-reveal-right order-1 lg:order-2">
              <h2 className={`${sora.className} text-4xl md:text-5xl font-bold tracking-tight mb-8`}>
                A command center that feels invisible.
              </h2>
              <div className="space-y-8 stagger-group">
                {[
                  { title: "Intelligent Routing", desc: "AI optimization assigns the right tech to the closest job, instantly reducing drive time and fuel costs.", icon: Navigation },
                  { title: "Seamless Handoffs", desc: "No more lost paperwork. Field techs get full job context, and the office gets real-time updates.", icon: FileText },
                  { title: "Zero-Friction Payments", desc: "Invoices are generated on-site and paid before the truck shifts into gear.", icon: Clock }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start scroll-reveal-right luxury-card-hover p-4 -ml-4 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-900/50">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm spring-icon">
                      <item.icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TESTIMONIAL / QUOTE */}
      <section className="py-32 bg-slate-900 dark:bg-white text-white dark:text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0,transparent_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.8)_0,transparent_100%)]"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 scroll-reveal-scale">
          <div className="flex justify-center gap-1 mb-8">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
          </div>
          <h2 className={`${sora.className} text-3xl md:text-5xl font-medium tracking-tight mb-12 leading-tight text-white dark:text-slate-900`}>
            "TradeFlow didn't just organize our dispatch board; it completely transformed our cash flow. We are billing 40% more effectively."
          </h2>
          <div className="font-semibold text-lg text-white dark:text-slate-900">Sarah Jenkins</div>
          <div className="text-slate-400 dark:text-slate-500">Operations Director, Elite Services</div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <TradeFlowLogo size="sm" />
              <span className="font-semibold text-sm">TradeFlow © 2026</span>
            </div>
            <CompactControlsBar />
          </div>
        </footer>

        <style jsx global>{`
          .scroll-reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
          .scroll-reveal-left { opacity: 0; transform: translateX(-40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
          .scroll-reveal-right { opacity: 0; transform: translateX(40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
          .scroll-reveal-scale { opacity: 0; transform: scale(0.95); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
          .in-view { opacity: 1 !important; transform: none !important; }
          
          .stagger-1 { transition-delay: 0.1s; }
          .stagger-2 { transition-delay: 0.2s; }
          .stagger-3 { transition-delay: 0.3s; }
          
          .stagger-group > *:nth-child(1) { transition-delay: 0.1s; }
          .stagger-group > *:nth-child(2) { transition-delay: 0.2s; }
          .stagger-group > *:nth-child(3) { transition-delay: 0.3s; }
          .stagger-group > *:nth-child(4) { transition-delay: 0.4s; }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
