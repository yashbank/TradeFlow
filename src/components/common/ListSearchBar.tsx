'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

export interface StatusTabItem {
  label: string;
  value: string;
  count?: number;
}

interface ListSearchBarProps {
  placeholder?: string;
  statusTabs?: StatusTabItem[];
  defaultSearch?: string;
  defaultStatus?: string;
  totalCount?: number;
}

export function ListSearchBar({
  placeholder = 'Search...',
  statusTabs,
  defaultSearch = '',
  defaultStatus = '',
  totalCount,
}: ListSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(defaultSearch);

  useEffect(() => {
    setSearchTerm(defaultSearch);
  }, [defaultSearch]);

  const updateFilters = (newSearch: string, newStatus?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch.trim()) {
      params.set('q', newSearch.trim());
    } else {
      params.delete('q');
    }

    if (newStatus !== undefined) {
      if (newStatus) {
        params.set('status', newStatus);
      } else {
        params.delete('status');
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    updateFilters('');
  };

  const currentStatus = searchParams.get('status') || defaultStatus || '';

  return (
    <div className="space-y-3">
      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                updateFilters(searchTerm);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl glass-panel text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs transition-all border border-slate-200/80 dark:border-zinc-800/80"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
        >
          {isPending ? 'Searching...' : 'Search'}
        </button>

        {typeof totalCount === 'number' && (
          <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-zinc-400 font-medium px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-zinc-800/70 shrink-0 border border-slate-200/50 dark:border-zinc-700/50">
            {totalCount} {totalCount === 1 ? 'record' : 'records'}
          </span>
        )}
      </form>

      {/* Filter Tabs (if provided) */}
      {statusTabs && statusTabs.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {statusTabs.map((tab) => {
            const isActive = currentStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateFilters(searchTerm, tab.value)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-xs shadow-sky-500/30'
                    : 'glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800/80'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
