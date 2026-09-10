'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { DollarSign, Check, Coins, RefreshCw } from 'lucide-react';

export function CurrencySelector() {
  const {
    selectedCurrency,
    setSelectedCurrency,
    currencies,
    currentCurrencyMeta,
    rates,
    ratesLoading,
  } = useCurrency();

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
        aria-label={`Current currency: ${selectedCurrency}. Click to change.`}
        title={`Currency: ${currentCurrencyMeta.name} (${selectedCurrency})`}
        className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white/90 dark:bg-zinc-800/90 dark:border-zinc-700/80 text-slate-700 dark:text-zinc-200 shadow-2xs hover:shadow-xs transition-all active:scale-90 hover:scale-105 font-bold text-xs"
      >
        <span className="text-sm font-black tracking-tight">{currentCurrencyMeta.symbol}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200/90 dark:border-zinc-700/90 bg-white dark:bg-zinc-900 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Select Currency</span>
            </div>
            {ratesLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin text-sky-500" />
            ) : (
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Live Rates Active
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-1 space-y-0.5">
            {currencies.map((curr) => {
              const isSelected = curr.code === selectedCurrency;
              const rateVsUsd = rates[curr.code] || 1.0;

              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => {
                    setSelectedCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-sky-50 text-sky-700 font-semibold dark:bg-sky-950/60 dark:text-sky-300'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none">{curr.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{curr.code}</span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          ({curr.symbol})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">{curr.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                      {curr.code === 'USD' ? '1.00' : rateVsUsd.toFixed(2)}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
