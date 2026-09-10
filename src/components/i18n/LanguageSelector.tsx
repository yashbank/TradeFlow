'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale, languages, currentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Current language: ${currentLanguage.nativeName}. Click to change.`}
        title={`Language: ${currentLanguage.nativeName}`}
        className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white/90 dark:bg-zinc-800/90 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-200 shadow-2xs hover:shadow-xs transition-all active:scale-90 hover:scale-105"
      >
        <span className="text-lg leading-none select-none" role="img" aria-label={currentLanguage.name}>
          {currentLanguage.flag}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Select Language</span>
          </div>

          <div className="max-h-72 overflow-y-auto p-1 space-y-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base" role="img" aria-label={lang.name}>
                      {lang.flag}
                    </span>
                    <div>
                      <p className="leading-none">{lang.nativeName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{lang.name}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
