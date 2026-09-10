'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'light' | 'dark' | 'colorful';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'tradeflow_theme_mode_v1';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (saved === 'light' || saved === 'dark' || saved === 'colorful') {
        applyTheme(saved);
        setThemeState(saved);
        return;
      }

      // Check system dark preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
        setThemeState('dark');
      } else {
        applyTheme('light');
        setThemeState('light');
      }
    } catch {
      applyTheme('light');
    }
  }, []);

  function applyTheme(targetTheme: AppTheme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', targetTheme);

    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('colorful');
    } else if (targetTheme === 'colorful') {
      root.classList.remove('dark');
      root.classList.add('colorful');
    } else {
      root.classList.remove('dark');
      root.classList.remove('colorful');
    }
  }

  function setTheme(newTheme: AppTheme) {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore
    }
  }

  function cycleTheme() {
    const nextTheme: AppTheme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'colorful' : 'light';
    setTheme(nextTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'light' as AppTheme,
      setTheme: () => {},
      cycleTheme: () => {},
    };
  }
  return ctx;
}
