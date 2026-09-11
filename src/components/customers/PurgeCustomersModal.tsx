'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { purgeEntityAction } from '@/actions/dataManagement';
import { useToast } from '@/lib/toast/ToastContext';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export function PurgeCustomersModal() {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePurge() {
    if (confirmation.trim().toUpperCase() !== 'DELETE') {
      toast.error('Confirmation Mismatch', 'Type DELETE to confirm customer data removal.');
      return;
    }

    setLoading(true);
    const res = await purgeEntityAction('customers');
    setLoading(false);

    if (res.success) {
      toast.success('Customers Purged', 'All customer records and linked orders have been wiped.');
      setIsOpen(false);
      setConfirmation('');
    } else {
      toast.error('Purge Failed', res.error || 'Failed to remove customer data.');
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setConfirmation('');
          setIsOpen(true);
        }}
        className="min-h-[44px] text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        Purge Customer Data
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full glass-panel-elevated border-red-500/40 shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Purge All Customer Records
                </CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs text-slate-600 dark:text-zinc-300">
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl space-y-1">
                <p className="font-bold text-red-800 dark:text-red-300">
                  ⚠️ Cascading Data Removal
                </p>
                <p>
                  This testing utility deletes <strong>all customers</strong> from your organization profile. To prevent orphaned database records, all linked quotes, jobs, invoices, and payments will also be safely removed.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-zinc-200 block">
                  Type <span className="font-mono text-red-600 dark:text-red-400">DELETE</span> to confirm:
                </label>
                <Input
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="min-h-[44px] font-mono text-sm tracking-widest bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100"
                />
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handlePurge}
                disabled={loading || confirmation.trim().toUpperCase() !== 'DELETE'}
                className="min-h-[44px] font-bold shadow-xs"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {loading ? 'Deleting...' : 'Confirm Purge'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
