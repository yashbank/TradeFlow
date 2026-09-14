'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  FileText,
  CalendarCheck2,
  Receipt,
  Users,
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  Command,
  X,
} from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

interface CommandItem {
  id: string;
  title: string;
  category: 'Quick Actions' | 'Navigation' | 'Preferences';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    {
      id: 'act-new-quote',
      title: 'New Quote',
      category: 'Quick Actions',
      icon: Plus,
      action: () => {
        router.push('/quotes/new');
        setIsOpen(false);
      },
      keywords: ['quote', 'proposal', 'estimate', 'create', 'new'],
    },
    {
      id: 'act-new-job',
      title: 'Schedule Job',
      category: 'Quick Actions',
      icon: CalendarCheck2,
      action: () => {
        router.push('/jobs/new');
        setIsOpen(false);
      },
      keywords: ['job', 'dispatch', 'schedule', 'work order'],
    },
    {
      id: 'act-customers',
      title: 'Add / View Customers',
      category: 'Quick Actions',
      icon: Users,
      action: () => {
        router.push('/customers');
        setIsOpen(false);
      },
      keywords: ['customer', 'client', 'add', 'people'],
    },
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => {
        router.push('/dashboard');
        setIsOpen(false);
      },
      keywords: ['dashboard', 'home', 'kpi', 'revenue'],
    },
    {
      id: 'nav-quotes',
      title: 'Quotes List',
      category: 'Navigation',
      icon: FileText,
      action: () => {
        router.push('/quotes');
        setIsOpen(false);
      },
      keywords: ['quotes', 'proposals', 'bids'],
    },
    {
      id: 'nav-jobs',
      title: 'Active Jobs & Dispatch',
      category: 'Navigation',
      icon: CalendarCheck2,
      action: () => {
        router.push('/jobs');
        setIsOpen(false);
      },
      keywords: ['jobs', 'calendar', 'dispatch', 'work'],
    },
    {
      id: 'nav-invoices',
      title: 'Invoices & Billing',
      category: 'Navigation',
      icon: Receipt,
      action: () => {
        router.push('/invoices');
        setIsOpen(false);
      },
      keywords: ['invoices', 'bills', 'payments', 'revenue'],
    },
    {
      id: 'nav-settings',
      title: 'Workspace Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => {
        router.push('/settings');
        setIsOpen(false);
      },
      keywords: ['settings', 'preferences', 'company', 'tax', 'stripe'],
    },
    {
      id: 'theme-toggle',
      title: `Switch Theme (Current: ${theme})`,
      category: 'Preferences',
      icon: theme === 'dark' ? Moon : theme === 'colorful' ? Sparkles : Sun,
      action: () => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'colorful' : 'light';
        setTheme(next);
        setIsOpen(false);
      },
      keywords: ['theme', 'dark', 'light', 'colorful', 'mode'],
    },
  ];

  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(lower) ||
      item.category.toLowerCase().includes(lower) ||
      item.keywords.some((k) => k.toLowerCase().includes(lower))
    );
  });

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.action();
      }
    }
  }

  return (
    <>
      {/* Top Navbar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-800 dark:hover:text-zinc-200 transition-all text-xs font-medium shadow-2xs group"
        title="Quick Command Palette (Cmd + K)"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-sky-500 transition-colors" />
        <span className="hidden sm:inline">Quick actions &amp; search...</span>
        <span className="sm:hidden">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-[10px] font-mono text-slate-400 dark:text-zinc-400 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Modal Backdrop & Command Bar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-slate-100 dark:border-zinc-800">
              <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 mr-3 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or jump to page..."
                className="w-full py-4 text-sm bg-transparent outline-none text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-zinc-800/40">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  No matching commands found.
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-sky-500/15 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? 'bg-sky-500 text-white'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p>{item.title}</p>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? 'translate-x-0.5 text-sky-600 dark:text-sky-400' : 'opacity-0'
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
              <span>Use ↑ ↓ to navigate, Enter to select</span>
              <kbd className="font-mono text-[10px]">Esc to close</kbd>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
