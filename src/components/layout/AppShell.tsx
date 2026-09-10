'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarCheck2,
  Receipt,
  Settings,
  LogOut,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { logoutUserAction } from '@/actions/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import type { Organization, UserProfile, UserRole } from '@/types/database';

interface AppShellProps {
  children: React.ReactNode;
  organization: Organization;
  user: UserProfile;
  role: UserRole;
}

export function AppShell({ children, organization, user, role }: AppShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const isTechnician = role === 'technician';
  const navItems = isTechnician
    ? [
        { label: t('nav.schedule'), href: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.my_jobs'), href: '/jobs', icon: CalendarCheck2 },
        { label: t('nav.customers'), href: '/customers', icon: Users },
      ]
    : [
        { label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.customers'), href: '/customers', icon: Users },
        { label: t('nav.quotes'), href: '/quotes', icon: FileText },
        { label: t('nav.jobs'), href: '/jobs', icon: CalendarCheck2 },
        { label: t('nav.invoices'), href: '/invoices', icon: Receipt },
        { label: t('nav.settings'), href: '/settings', icon: Settings },
      ];

  function getNavIconStyle(href: string, isActive: boolean) {
    if (theme === 'colorful') {
      if (href.includes('dashboard')) return 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/30';
      if (href.includes('customers')) return 'bg-gradient-to-tr from-cyan-500 to-teal-500 text-white shadow-sm shadow-cyan-500/30';
      if (href.includes('quotes')) return 'bg-gradient-to-tr from-fuchsia-500 to-pink-500 text-white shadow-sm shadow-fuchsia-500/30';
      if (href.includes('jobs')) return 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30';
      if (href.includes('invoices')) return 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/30';
      return 'bg-gradient-to-tr from-violet-500 to-purple-600 text-white shadow-sm shadow-purple-500/30';
    }
    if (theme === 'dark') {
      if (isActive) return 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs shadow-sky-500/20';
      if (href.includes('dashboard')) return 'bg-zinc-800/90 text-sky-400 border border-zinc-700/60';
      if (href.includes('customers')) return 'bg-zinc-800/90 text-teal-400 border border-zinc-700/60';
      if (href.includes('quotes')) return 'bg-zinc-800/90 text-pink-400 border border-zinc-700/60';
      if (href.includes('jobs')) return 'bg-zinc-800/90 text-amber-400 border border-zinc-700/60';
      if (href.includes('invoices')) return 'bg-zinc-800/90 text-emerald-400 border border-zinc-700/60';
      return 'bg-zinc-800/90 text-violet-400 border border-zinc-700/60';
    }
    // Light mode
    if (isActive) return 'bg-blue-600 text-white shadow-sm shadow-blue-600/30';
    if (href.includes('dashboard')) return 'bg-blue-50 text-blue-600 border border-blue-100';
    if (href.includes('customers')) return 'bg-teal-50 text-teal-600 border border-teal-100';
    if (href.includes('quotes')) return 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100';
    if (href.includes('jobs')) return 'bg-amber-50 text-amber-600 border border-amber-100';
    if (href.includes('invoices')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent text-foreground transition-colors duration-200">
      {/* Desktop Animated Hover Sidebar */}
      <aside className="hidden md:flex flex-col w-[72px] hover:w-64 glass-panel-elevated min-h-screen p-3 sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out group/sidebar overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-1.5 py-3 mb-3 border-b border-slate-200/50 dark:border-zinc-800/60">
          <div className="bg-gradient-to-tr from-sky-500 to-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-sky-500/25 shrink-0 spring-icon">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 overflow-hidden whitespace-nowrap min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-zinc-100 truncate text-sm leading-tight">
              {organization.name}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium capitalize truncate">
                {role} {t('nav.workspace')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-1.5 py-2 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-sky-500/15 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold border border-sky-500/30 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/70 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <div
                  className={`p-2 rounded-xl flex items-center justify-center shrink-0 spring-icon ${getNavIconStyle(
                    item.href,
                    isActive
                  )}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 overflow-hidden whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="pt-3 border-t border-slate-200/50 dark:border-zinc-800/60">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-zinc-800 dark:to-zinc-700 text-slate-800 dark:text-zinc-200 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs border border-white/20">
                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 overflow-hidden whitespace-nowrap min-w-0 pr-1">
                <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{user.full_name}</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
            <form
              action={logoutUserAction}
              className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 shrink-0"
            >
              <button
                type="submit"
                title={t('nav.logout')}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 glass-panel-elevated sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-gradient-to-tr from-sky-500 to-blue-600 text-white p-1.5 rounded-lg shadow-sm">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs truncate max-w-[130px]">
            {organization.name}
          </span>
        </div>

        {/* Controls: Theme, Language, Currency, Logout */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageSelector />
          <CurrencySelector />
          <form action={logoutUserAction}>
            <button
              type="submit"
              title={t('nav.logout')}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Navbar (Header Bar) */}
        <div className="hidden md:flex items-center justify-between px-8 py-3.5 glass-panel-elevated sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 dark:bg-cyan-950/60 text-sky-700 dark:text-cyan-300 font-bold border border-sky-500/20">
              TradeFlow FSM
            </span>
            <span>•</span>
            <span className="capitalize">{role} Portal</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector />
            <CurrencySelector />
          </div>
        </div>

        <main className="flex-1 pb-24 md:pb-12 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in-50 duration-200">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb ergonomic) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-slate-200 dark:border-zinc-800 flex justify-around items-center h-16 z-40 px-1 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full text-[11px] font-semibold transition-transform active:scale-90 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <div
                className={`p-1 rounded-lg mb-0.5 transition-colors ${
                  isActive ? 'bg-blue-50 dark:bg-blue-950/60' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
