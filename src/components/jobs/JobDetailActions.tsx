'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updateJobStatusAction, convertJobToInvoiceAction } from '@/actions/jobs';
import { Play, CheckCircle, Receipt, X } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';
import type { Job } from '@/types/database';

interface JobDetailActionsProps {
  job: Job;
}

export function JobDetailActions({ job }: JobDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [internalNotes, setInternalNotes] = useState(job.internal_notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    const res = await updateJobStatusAction(job.id, 'in_progress');
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to start job');
      toast.error('Start Failed', res.error || 'Failed to start job');
    } else {
      toast.success('Job Started', `Work order #${job.job_number || ''} is now In Progress`);
      router.refresh();
    }
  }

  async function handleComplete() {
    setLoading(true);
    setError(null);
    const res = await updateJobStatusAction(job.id, 'completed', internalNotes.trim());
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to complete job');
      toast.error('Completion Failed', res.error || 'Failed to complete job');
    } else {
      toast.success('Job Completed', `Work order #${job.job_number || ''} marked complete`);
      setShowCompleteModal(false);
      router.refresh();
    }
  }

  async function handleCreateInvoice() {
    setLoading(true);
    setError(null);
    const res = await convertJobToInvoiceAction(job.id);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || 'Failed to convert job to invoice');
      toast.error('Invoice Creation Failed', res.error || 'Failed to convert job to invoice');
    } else {
      toast.success('Invoice Created', `Invoice #${res.data.invoice_number || ''} generated`);
      router.push(`/invoices/${res.data.id}`);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {job.status === 'scheduled' && (
          <Button size="sm" onClick={handleStart} disabled={loading} className="min-h-[44px]">
            <Play className="w-4 h-4 mr-1.5" />
            {loading ? 'Starting...' : 'Start Job'}
          </Button>
        )}

        {job.status === 'in_progress' && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setShowCompleteModal(true)}
            disabled={loading}
            className="min-h-[44px]"
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Complete Job
          </Button>
        )}

        {job.status === 'completed' && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateInvoice}
            disabled={loading}
            className="min-h-[44px] shadow-sm animate-pulse"
          >
            <Receipt className="w-4 h-4 mr-1.5" />
            {loading ? 'Generating...' : 'Create Invoice Now'}
          </Button>
        )}
      </div>

      {/* Sticky Mobile Thumb-Zone Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-50 shadow-2xl flex items-center justify-between gap-2">
        {job.status === 'scheduled' && (
          <Button
            size="sm"
            onClick={handleStart}
            disabled={loading}
            className="w-full min-h-[48px] font-bold text-base"
          >
            <Play className="w-5 h-5 mr-2" />
            {loading ? 'Starting...' : 'Start Job Now'}
          </Button>
        )}

        {job.status === 'in_progress' && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setShowCompleteModal(true)}
            disabled={loading}
            className="w-full min-h-[48px] font-bold text-base"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Complete Job
          </Button>
        )}

        {job.status === 'completed' && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateInvoice}
            disabled={loading}
            className="w-full min-h-[48px] font-bold text-base shadow-sm"
          >
            <Receipt className="w-5 h-5 mr-2" />
            {loading ? 'Generating...' : 'Create Invoice'}
          </Button>
        )}
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Complete Job</CardTitle>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500">
                Mark this plumbing job completed. You can add internal notes or parts used before issuing the invoice.
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Internal Completion Notes / Work Summary:
                </label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Replaced faulty pressure relief valve. Tested cold/hot pressure at 60 PSI."
                  className="w-full text-xs rounded-md border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleComplete} disabled={loading}>
                {loading ? 'Completing...' : 'Mark Completed'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
