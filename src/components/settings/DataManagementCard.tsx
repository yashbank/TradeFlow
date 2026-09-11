'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getWorkspaceStatsAction, purgeEntityAction } from '@/actions/dataManagement';
import { useToast } from '@/lib/toast/ToastContext';
import {
  AlertTriangle,
  Trash2,
  RefreshCcw,
  Users,
  FileText,
  CalendarCheck2,
  Receipt,
  X,
} from 'lucide-react';
import type { PurgeEntity, WorkspaceStats } from '@/services/DataManagementService';

export function DataManagementCard() {
  const toast = useToast();
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<PurgeEntity | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [purging, setPurging] = useState(false);

  async function loadStats() {
    setLoading(true);
    const res = await getWorkspaceStatsAction();
    setLoading(false);
    if (res.success && res.data) {
      setStats(res.data);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleConfirmPurge() {
    if (!selectedEntity) return;
    if (confirmationInput.trim().toUpperCase() !== 'PURGE') {
      toast.error('Confirmation Mismatch', 'Type PURGE to proceed with data removal.');
      return;
    }

    setPurging(true);
    const res = await purgeEntityAction(selectedEntity);
    setPurging(false);

    if (res.success) {
      toast.success(
        'Workspace Data Purged',
        `Successfully removed ${selectedEntity === 'all' ? 'all transactional data' : selectedEntity}.`
      );
      setSelectedEntity(null);
      setConfirmationInput('');
      await loadStats();
    } else {
      toast.error('Purge Failed', res.error || 'Failed to purge data.');
    }
  }

  return (
    <>
      <Card className="border-red-300/60 dark:border-red-900/60 bg-gradient-to-r from-red-50/40 via-orange-50/20 to-red-50/30 dark:from-red-950/20 dark:to-orange-950/20">
        <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-red-950 dark:text-red-100 flex items-center gap-2">
                Workspace Data Management & Testing Reset
                <Badge variant="destructive" className="uppercase text-[10px]">
                  Danger Zone
                </Badge>
              </CardTitle>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                Manage test data, reset sequential numbering (#0001), or bulk purge entities.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="min-h-[44px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
          >
            <RefreshCcw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Counts
          </Button>
        </CardHeader>

        <CardContent className="p-6 pt-3 space-y-4">
          {/* Live Data Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                <span className="flex items-center gap-1 font-semibold">
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                  Customers
                </span>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                {stats?.customersCount ?? '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                <span className="flex items-center gap-1 font-semibold">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Quotes
                </span>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                {stats?.quotesCount ?? '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                <span className="flex items-center gap-1 font-semibold">
                  <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                  Jobs
                </span>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                {stats?.jobsCount ?? '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/70 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-1">
                <span className="flex items-center gap-1 font-semibold">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" />
                  Invoices
                </span>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                {stats?.invoicesCount ?? '—'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-400">
            Select a category below to purge test records. Foreign keys are automatically cascading, safely removing dependent items without database lockup.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEntity('quotes');
                setConfirmationInput('');
              }}
              className="min-h-[44px] text-xs font-bold border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Purge All Quotes
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEntity('jobs');
                setConfirmationInput('');
              }}
              className="min-h-[44px] text-xs font-bold border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Purge All Jobs
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEntity('invoices');
                setConfirmationInput('');
              }}
              className="min-h-[44px] text-xs font-bold border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Purge All Invoices
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEntity('customers');
                setConfirmationInput('');
              }}
              className="min-h-[44px] text-xs font-bold border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Purge All Customers (Cascading)
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSelectedEntity('all');
                setConfirmationInput('');
              }}
              className="min-h-[44px] text-xs font-black shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Factory Reset Testing Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full glass-panel-elevated border-red-500/40 shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Confirm Data Purge: {selectedEntity.toUpperCase()}
                </CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs text-slate-600 dark:text-zinc-300">
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl space-y-1">
                <p className="font-bold text-red-800 dark:text-red-300">
                  ⚠️ Irreversible Action
                </p>
                <p>
                  {selectedEntity === 'all'
                    ? 'This will delete ALL customers, quotes, jobs, invoices, and payments in this organization. Sequence counters will reset to #0001. Your company profile, team accounts, and subscription remain untouched.'
                    : selectedEntity === 'customers'
                    ? 'This will delete ALL customers and automatically cascade to all dependent quotes, jobs, and invoices.'
                    : `This will permanently delete all records in the ${selectedEntity} table.`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Type <span className="font-mono text-red-600 dark:text-red-400">PURGE</span> to confirm:
                </label>
                <Input
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="Type PURGE here..."
                  className="min-h-[44px] font-mono text-sm tracking-widest bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100"
                />
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEntity(null)}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmPurge}
                disabled={purging || confirmationInput.trim().toUpperCase() !== 'PURGE'}
                className="min-h-[44px] font-bold shadow-xs"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {purging ? 'Purging...' : 'Confirm & Delete'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
