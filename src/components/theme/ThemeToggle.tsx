'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, type AppTheme } from '@/lib/theme/ThemeContext';
import { Droplets, Shield, Sparkles, Check } from 'lucide-react';

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
    icon: typeof Droplets;
    pillClass: string;
  }[] = [
    {
      key: 'light',
      label: 'Fresh Stream',
      description: 'Crisp aquatic slate & clean daylight',
      icon: Droplets,
      pillClass: 'bg-sky-100 text-sky-600 border border-sky-200/80',
    },
    {
      key: 'dark',
      label: 'Deep Drainage',
      description: 'Obsidian midnight with electric cyan glow',
      icon: Shield,
      pillClass: 'bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 shadow-xs shadow-cyan-500/20',
    },
    {
      key: 'colorful',
      label: 'Hydro Neon',
      description: 'Twilight violet & iridescent liquid aurora',
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
        aria-label={`Current identity: ${currentOption.label}. Click to switch theme.`}
        title={`Fluid Theme: ${currentOption.label}`}
        className="group flex items-center justify-center w-9 h-9 rounded-xl glass-panel-elevated hover:scale-105 active:scale-95 transition-all text-slate-800 dark:text-zinc-100"
      >
        <div className={`p-1.5 rounded-lg ${currentOption.pillClass} transition-all spring-icon`}>
          <CurrentIcon className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 rounded-2xl glass-panel-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-1.5 text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest border-b border-slate-200/50 dark:border-zinc-800/60 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>Fluid Atmosphere Engine</span>
          </div>

          <div className="p-1.5 space-y-1">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left group ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-900 dark:text-sky-200 font-bold border border-sky-500/30'
                      : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${opt.pillClass} spring-icon`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold leading-tight">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
