'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type SupportedLocale,
  type LanguageMeta,
  SUPPORTED_LANGUAGES,
  translate,
} from './translations';

interface LanguageContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageMeta[];
  currentLanguage: LanguageMeta;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'tradeflow_locale_v1';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en-US');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setLocaleState(saved);
        return;
      }

      // Auto-detect browser language
      const browserLang = navigator.language;
      if (browserLang.startsWith('es')) setLocaleState('es');
      else if (browserLang.startsWith('fr')) setLocaleState('fr');
      else if (browserLang.startsWith('de')) setLocaleState('de');
      else if (browserLang.startsWith('hi')) setLocaleState('hi');
      else if (browserLang.startsWith('ja')) setLocaleState('ja');
      else if (browserLang.startsWith('zh')) setLocaleState('zh');
      else if (browserLang === 'en-GB') setLocaleState('en-GB');
      else setLocaleState('en-US');
    } catch {
      // Fallback
    }
  }, []);

  function setLocale(newLocale: SupportedLocale) {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore
    }
  }

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];

  function t(key: string, params?: Record<string, string | number>): string {
    return translate(locale, key, params);
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback safe implementation if accessed outside provider
    return {
      locale: 'en-US' as SupportedLocale,
      setLocale: () => {},
      t: (k: string, p?: Record<string, string | number>) => translate('en-US', k, p),
      languages: SUPPORTED_LANGUAGES,
      currentLanguage: SUPPORTED_LANGUAGES[0],
    };
  }
  return ctx;
}
