import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SupportedCurrency } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  INR: 'en-IN',
  JPY: 'ja-JP',
};

export function formatCurrency(amountCents: number, currency: SupportedCurrency = 'USD'): string {
  const locale = CURRENCY_LOCALES[currency] || 'en-US';
  const isZeroDecimal = currency === 'JPY';
  const amountUnits = amountCents / 100;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(isZeroDecimal ? Math.round(amountUnits) : amountUnits);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    // If date-only format YYYY-MM-DD, parse as UTC to avoid local timezone shifts
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    const date = isDateOnly ? new Date(`${dateString}T00:00:00Z`) : new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: isDateOnly ? 'UTC' : undefined,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://tradeflow-cyan-nu.vercel.app';
}
