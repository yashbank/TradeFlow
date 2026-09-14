'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { Globe, DollarSign, Sun, Moon, Check } from 'lucide-react';

export function CompactControlsBar() {
  const { theme, cycleTheme } = useTheme();
  const { locale, setLocale, languages } = useTranslation();
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();

  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (currRef.current && !currRef.current.contains(event.target as Node)) {
        setCurrOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5 z-50">
      {/* Language Selector Chip */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => {
            setLangOpen(!langOpen);
            setCurrOpen(false);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/80 border border-slate-200/60 text-slate-600 hover:bg-white hover:text-slate-900 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors backdrop-blur-sm"
          title="Select Language"
        >
          <Globe className="w-4 h-4" />
        </button>

        {langOpen && (
          <div className="absolute right-0 mt-2 min-w-[140px] rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden py-1 z-50">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code);
                  setLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ${
                  locale === l.code
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </span>
                {locale === l.code && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Currency Selector Chip */}
      <div className="relative" ref={currRef}>
        <button
          onClick={() => {
            setCurrOpen(!currOpen);
            setLangOpen(false);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/80 border border-slate-200/60 text-slate-600 hover:bg-white hover:text-slate-900 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors backdrop-blur-sm"
          title="Select Currency"
        >
          <DollarSign className="w-4 h-4" />
        </button>

        {currOpen && (
          <div className="absolute right-0 mt-2 min-w-[140px] rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden py-1 z-50">
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setSelectedCurrency(c.code);
                  setCurrOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors ${
                  selectedCurrency === c.code
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span>{c.code} ({c.symbol})</span>
                {selectedCurrency === c.code && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme Toggle Chip */}
      <button
        onClick={cycleTheme}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/80 border border-slate-200/60 text-slate-600 hover:bg-white hover:text-slate-900 dark:bg-zinc-800/80 dark:border-zinc-700/60 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 transition-colors backdrop-blur-sm"
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>
    </div>
  );
}
