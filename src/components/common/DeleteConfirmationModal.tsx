'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (forceCascade?: boolean) => Promise<void>;
  title: string;
  entityName: string;
  warningMessage?: string;
  hasCascadeImpact?: boolean;
  cascadeDetails?: {
    quotesCount?: number;
    jobsCount?: number;
    invoicesCount?: number;
  };
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  warningMessage,
  hasCascadeImpact = false,
  cascadeDetails,
}: DeleteConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [cascadeConfirmed, setCascadeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConfirm() {
    if (hasCascadeImpact && !cascadeConfirmed) {
      setError('Please acknowledge that all linked transactions will be permanently deleted.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(cascadeConfirmed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md shadow-2xl border-rose-500/30 dark:border-rose-900/60 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Permanently delete {entityName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
              <p className="font-bold mb-0.5">Warning: Irreversible Action</p>
              <p>{warningMessage || `Are you sure you want to delete ${entityName}? This action cannot be undone.`}</p>
            </div>
          </div>

          {hasCascadeImpact && cascadeDetails && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-bold">Linked Records Found:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {cascadeDetails.quotesCount ? <li>{cascadeDetails.quotesCount} Quote(s)</li> : null}
                {cascadeDetails.jobsCount ? <li>{cascadeDetails.jobsCount} Scheduled Job(s)</li> : null}
                {cascadeDetails.invoicesCount ? <li>{cascadeDetails.invoicesCount} Invoices & Payments</li> : null}
              </ul>

              <label className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cascadeConfirmed}
                  onChange={(e) => setCascadeConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 border-amber-400 focus:ring-rose-500"
                />
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Force cascade delete of all linked records
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 text-xs border border-rose-300 dark:border-rose-800">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={loading || (hasCascadeImpact && !cascadeConfirmed)}
            className="min-h-[44px] font-bold px-5 bg-rose-600 hover:bg-rose-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-1.5" />
                Confirm Delete
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
