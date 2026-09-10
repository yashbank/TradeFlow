'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  type CurrencyCode,
  type CurrencyMeta,
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES,
  convertCurrencyCents,
  formatCurrencyLocale,
  parseExchangeRatesResponse,
} from './rates';

export {
  type CurrencyCode,
  type CurrencyMeta,
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES,
  convertCurrencyCents,
  formatCurrencyLocale,
  parseExchangeRatesResponse,
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
        const updatedRates = parseExchangeRatesResponse(data);
        setRates(updatedRates);
        try {
          localStorage.setItem(
            STORAGE_RATES_KEY,
            JSON.stringify({ timestamp: Date.now(), rates: updatedRates })
          );
        } catch {
          // Ignore
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
    return convertCurrencyCents(amountCents, fromCurrency, toCurrency, rates);
  }

  /**
   * Converts base cents to selected currency and formats with appropriate currency symbol.
   */
  function formatConverted(amountCents: number, baseCurrency: CurrencyCode = 'USD'): string {
    const convertedCents = convertCents(amountCents, baseCurrency, selectedCurrency);
    return formatCurrencyLocale(convertedCents, selectedCurrency);
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
