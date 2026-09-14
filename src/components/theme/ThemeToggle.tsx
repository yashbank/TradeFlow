'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, type AppTheme } from '@/lib/theme/ThemeContext';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Droplets, Moon, Sparkles, Check } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
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

  const themeOptions: {
    key: AppTheme;
    labelKey: string;
    fallbackLabel: string;
    icon: typeof Droplets;
    pillClass: string;
  }[] = [
    {
      key: 'light',
      labelKey: 'theme.stream',
      fallbackLabel: 'Stream',
      icon: Droplets,
      pillClass: 'bg-sky-100 text-sky-600 border border-sky-200/80',
    },
    {
      key: 'dark',
      labelKey: 'theme.midnight',
      fallbackLabel: 'Midnight',
      icon: Moon,
      pillClass: 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 shadow-xs shadow-cyan-500/20',
    },
    {
      key: 'colorful',
      labelKey: 'theme.neon',
      fallbackLabel: 'Neon',
      icon: Sparkles,
      pillClass: 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-xs shadow-purple-500/30',
    },
  ];

  const currentOption = themeOptions.find((t) => t.key === theme) || themeOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Theme: ${currentOption.fallbackLabel}. Click to switch theme.`}
        title={`Fluid Theme: ${currentOption.fallbackLabel}`}
        className="group flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl glass-panel-elevated hover:scale-105 active:scale-95 transition-all text-slate-800 dark:text-zinc-100"
      >
        <div className={`p-1.5 rounded-lg ${currentOption.pillClass} transition-all spring-icon`}>
          <CurrentIcon className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 rounded-2xl glass-panel-elevated p-1.5 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl">
          <div className="flex items-center gap-1">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = opt.key === theme;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setTheme(opt.key);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30 scale-[1.02]'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t(opt.labelKey) || opt.fallbackLabel}</span>
                  {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
