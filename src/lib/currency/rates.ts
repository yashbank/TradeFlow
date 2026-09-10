// ==============================================================================
// src/lib/currency/rates.ts — Multi-Currency Conversion, Formatting & Rate Utilities
// ==============================================================================

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

// Fallback exchange rates against 1.0 USD when offline or API is unreachable
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.5,
  JPY: 155.0,
};

/**
 * Converts integer cents from one currency to another using exchange rates.
 * Normalized to USD base then converted to target rate.
 */
export function convertCurrencyCents(
  amountCents: number,
  fromCurrency: CurrencyCode = 'USD',
  toCurrency: CurrencyCode = 'USD',
  rates: Record<CurrencyCode, number> = FALLBACK_RATES
): number {
  if (fromCurrency === toCurrency) return Math.round(amountCents);
  const fromRate = rates[fromCurrency] && rates[fromCurrency] > 0 ? rates[fromCurrency] : 1.0;
  const toRate = rates[toCurrency] && rates[toCurrency] > 0 ? rates[toCurrency] : 1.0;
  // Normalize to USD then multiply by target rate
  const usdAmount = amountCents / fromRate;
  return Math.round(usdAmount * toRate);
}

/**
 * Formats integer cents with appropriate international locale, currency symbol,
 * and handles 0-decimal currencies like JPY.
 */
export function formatCurrencyLocale(
  amountCents: number,
  currency: CurrencyCode = 'USD'
): string {
  const meta =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];
  const isZeroDecimal = currency === 'JPY';
  const amountUnits = amountCents / 100;

  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(isZeroDecimal ? Math.round(amountUnits) : amountUnits);
  } catch {
    return `${meta.symbol}${amountUnits.toFixed(isZeroDecimal ? 0 : 2)}`;
  }
}

/**
 * Safely parses and validates exchange rates from open.er-api.com API response.
 * Defends against missing, negative, NaN, or zero rates by falling back.
 */
export function parseExchangeRatesResponse(data: any): Record<CurrencyCode, number> {
  if (!data || typeof data !== 'object' || !data.rates) {
    return { ...FALLBACK_RATES };
  }

  const validRate = (code: CurrencyCode): number => {
    const val = data.rates[code];
    return typeof val === 'number' && !isNaN(val) && val > 0 ? val : FALLBACK_RATES[code];
  };

  return {
    USD: 1.0,
    EUR: validRate('EUR'),
    GBP: validRate('GBP'),
    CAD: validRate('CAD'),
    AUD: validRate('AUD'),
    INR: validRate('INR'),
    JPY: validRate('JPY'),
  };
}
