'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | 'JPY';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP' },
];

// Fallback rates against USD in case API is temporarily unavailable
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.5,
  JPY: 155.0,
};

interface CurrencyContextValue {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (currency: CurrencyCode) => void;
  currencies: CurrencyMeta[];
  currentCurrencyMeta: CurrencyMeta;
  rates: Record<CurrencyCode, number>;
  ratesLoading: boolean;
  convertCents: (amountCents: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number;
  formatConverted: (amountCents: number, baseCurrency?: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_CURRENCY_KEY = 'tradeflow_currency_v1';
const STORAGE_RATES_KEY = 'tradeflow_rates_cache_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>('USD');
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState<boolean>(true);

  // Initialize selected currency from localStorage
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem(STORAGE_CURRENCY_KEY) as CurrencyCode | null;
      if (savedCurrency && SUPPORTED_CURRENCIES.some((c) => c.code === savedCurrency)) {
        setSelectedCurrencyState(savedCurrency);
      }
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  // Fetch live exchange rates from free open.er-api.com
  useEffect(() => {
    async function loadRates() {
      // 1. Check local cache first
      try {
        const cachedRaw = localStorage.getItem(STORAGE_RATES_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Date.now() - cached.timestamp < CACHE_TTL_MS && cached.rates) {
            setRates(cached.rates);
            setRatesLoading(false);
            return;
          }
        }
      } catch {
        // Continue to fetch
      }

      // 2. Fetch live rates
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
          next: { revalidate: 3600 },
        });
        if (!res.ok) throw new Error('Failed to fetch exchange rates');
        const data = await res.json();
        if (data && data.rates) {
          const updatedRates: Record<CurrencyCode, number> = {
            USD: 1.0,
            EUR: data.rates.EUR || FALLBACK_RATES.EUR,
            GBP: data.rates.GBP || FALLBACK_RATES.GBP,
            CAD: data.rates.CAD || FALLBACK_RATES.CAD,
            AUD: data.rates.AUD || FALLBACK_RATES.AUD,
            INR: data.rates.INR || FALLBACK_RATES.INR,
            JPY: data.rates.JPY || FALLBACK_RATES.JPY,
          };
          setRates(updatedRates);
          try {
            localStorage.setItem(
              STORAGE_RATES_KEY,
              JSON.stringify({ timestamp: Date.now(), rates: updatedRates })
            );
          } catch {
            // Ignore
          }
        }
      } catch (err) {
        console.warn('Using fallback exchange rates:', err);
      } finally {
        setRatesLoading(false);
      }
    }

    loadRates();
  }, []);

  function setSelectedCurrency(currency: CurrencyCode) {
    setSelectedCurrencyState(currency);
    try {
      localStorage.setItem(STORAGE_CURRENCY_KEY, currency);
    } catch {
      // Ignore
    }
  }

  /**
   * Converts cents from one currency to another using exchange rates.
   */
  function convertCents(
    amountCents: number,
    fromCurrency: CurrencyCode = 'USD',
    toCurrency: CurrencyCode = selectedCurrency
  ): number {
    if (fromCurrency === toCurrency) return amountCents;
    const fromRate = rates[fromCurrency] || 1.0;
    const toRate = rates[toCurrency] || 1.0;
    // Normalize to USD then multiply by target rate
    const usdAmount = amountCents / fromRate;
    return Math.round(usdAmount * toRate);
  }

  /**
   * Converts base cents to selected currency and formats with appropriate currency symbol.
   */
  function formatConverted(amountCents: number, baseCurrency: CurrencyCode = 'USD'): string {
    const convertedCents = convertCents(amountCents, baseCurrency, selectedCurrency);
    const meta =
      SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

    const amountUnits = convertedCents / 100;

    // Format using native Intl with specific currency symbol
    try {
      return new Intl.NumberFormat(meta.locale, {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: selectedCurrency === 'JPY' ? 0 : 2,
        maximumFractionDigits: selectedCurrency === 'JPY' ? 0 : 2,
      }).format(selectedCurrency === 'JPY' ? Math.round(amountUnits) : amountUnits);
    } catch {
      return `${meta.symbol}${amountUnits.toFixed(2)}`;
    }
  }

  const currentCurrencyMeta =
    SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        currencies: SUPPORTED_CURRENCIES,
        currentCurrencyMeta,
        rates,
        ratesLoading,
        convertCents,
        formatConverted,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      selectedCurrency: 'USD' as CurrencyCode,
      setSelectedCurrency: () => {},
      currencies: SUPPORTED_CURRENCIES,
      currentCurrencyMeta: SUPPORTED_CURRENCIES[0],
      rates: FALLBACK_RATES,
      ratesLoading: false,
      convertCents: (cents: number) => cents,
      formatConverted: (cents: number) => `$${(cents / 100).toFixed(2)}`,
    };
  }
  return context;
}
