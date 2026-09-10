'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, type AppTheme } from '@/lib/theme/ThemeContext';
import { Sun, Moon, Palette, Check, ChevronDown } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
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
    label: string;
    description: string;
    icon: typeof Sun;
    pillClass: string;
  }[] = [
    {
      key: 'light',
      label: 'Light Mode',
      description: 'Crisp, high-contrast daytime UI',
      icon: Sun,
      pillClass: 'bg-amber-100 text-amber-600',
    },
    {
      key: 'dark',
      label: 'Dark Mode',
      description: 'Deep zinc midnight palette',
      icon: Moon,
      pillClass: 'bg-indigo-900/60 text-indigo-300',
    },
    {
      key: 'colorful',
      label: 'Colorful Theme',
      description: 'Vibrant neon gradients & rich accents',
      icon: Palette,
      pillClass: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
    },
  ];

  const currentOption = themeOptions.find((t) => t.key === theme) || themeOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Current theme: ${currentOption.label}. Click to switch appearance.`}
        title={`Theme: ${currentOption.label}`}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white/90 dark:bg-zinc-800/90 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-200 shadow-2xs hover:shadow-xs transition-all active:scale-90 hover:scale-105"
      >
        <div className={`p-1.5 rounded-lg ${currentOption.pillClass} transition-all`}>
          <CurrentIcon className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>Select Appearance</span>
          </div>

          <div className="p-1 space-y-1">
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
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${opt.pillClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{opt.description}</p>
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
