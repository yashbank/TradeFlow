'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface FilterTab {
  key: string;
  label: string;
  count?: number;
}

export interface SortOption {
  key: string;
  label: string;
}

interface ListFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  statusTabs?: FilterTab[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  sortOptions?: SortOption[];
  selectedSort?: string;
  onSortChange?: (sort: string) => void;
  totalCount?: number;
  children?: React.ReactNode;
}

export function ListFilterBar({
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  statusTabs,
  selectedStatus,
  onStatusChange,
  sortOptions,
  selectedSort,
  onSortChange,
  totalCount,
  children,
}: ListFilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Top Bar: Search Input, Sorters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Searchbar */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl glass-panel text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs transition-all border border-slate-200/80 dark:border-zinc-800/80"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Sort selector, Record count & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {sortOptions && onSortChange && (
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold glass-panel border border-slate-200/80 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          )}

          {typeof totalCount === 'number' && (
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium px-2 py-1 rounded-lg bg-slate-100/60 dark:bg-zinc-800/60">
              {totalCount} {totalCount === 1 ? 'record' : 'records'}
            </span>
          )}

          {children}
        </div>
      </div>

      {/* Status Filter Tabs (if provided) */}
      {statusTabs && onStatusChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {statusTabs.map((tab) => {
            const isActive = (selectedStatus || 'all') === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStatusChange(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-xs shadow-sky-500/30'
                    : 'glass-panel text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
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
