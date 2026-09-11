'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updateJobStatusAction, convertJobToInvoiceAction, updateJobAction, deleteJobAction } from '@/actions/jobs';
import { Play, CheckCircle, Receipt, X, Pencil, Clock, MapPin, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast/ToastContext';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import type { Job } from '@/types/database';

interface JobDetailActionsProps {
  job: Job;
}

export function JobDetailActions({ job }: JobDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [internalNotes, setInternalNotes] = useState(job.internal_notes || '');
  const [loading, setLoading] = useState(false);
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteJob() {
    const res = await deleteJobAction(job.id);
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete work order');
    }
    toast.success('Job Deleted', `Work order ${job.job_number} has been deleted.`);
    router.push('/jobs');
  }

  // Edit fields
  const [editTitle, setEditTitle] = useState(job.title);
  const [editDescription, setEditDescription] = useState(job.description || '');
  const [editStart, setEditStart] = useState(job.scheduled_start ? job.scheduled_start.slice(0, 16) : '');
  const [editEnd, setEditEnd] = useState(job.scheduled_end ? job.scheduled_end.slice(0, 16) : '');
  const [editAddress, setEditAddress] = useState(job.address_line1 || '');
  const [editCity, setEditCity] = useState(job.city || '');
  const [editState, setEditState] = useState(job.state || '');
  const [editPostalCode, setEditPostalCode] = useState(job.postal_code || '');
  const [editNotes, setEditNotes] = useState(job.internal_notes || '');

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

  async function handleEditJob(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingJob(true);
    setError(null);
    const res = await updateJobAction(job.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      scheduled_start: editStart ? new Date(editStart).toISOString() : undefined,
      scheduled_end: editEnd ? new Date(editEnd).toISOString() : undefined,
      address_line1: editAddress.trim(),
      city: editCity.trim(),
      state: editState.trim(),
      postal_code: editPostalCode.trim(),
      internal_notes: editNotes.trim(),
    });
    setIsUpdatingJob(false);
    if (!res.success) {
      setError(res.error || 'Failed to update work order');
      toast.error('Update Failed', res.error || 'Failed to update work order');
    } else {
      toast.success('Work Order Updated', `Job #${job.job_number || ''} details successfully saved`);
      setShowEditModal(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowEditModal(true)}
          className="min-h-[44px]"
        >
          <Pencil className="w-4 h-4 mr-1.5 text-slate-500 dark:text-zinc-400" />
          Edit Work Order
        </Button>

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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="min-h-[44px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete
        </Button>
      </div>

      {/* Sticky Mobile Thumb-Zone Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-slate-200 dark:border-zinc-800 z-50 shadow-2xl flex items-center justify-between gap-2">
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
          <Card className="w-full max-w-md dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-lg dark:text-zinc-100">Complete Job</CardTitle>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Mark this plumbing job completed. You can add internal notes or parts used before issuing the invoice.
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Internal Completion Notes / Work Summary:
                </label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Replaced faulty pressure relief valve. Tested cold/hot pressure at 60 PSI."
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
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

      {/* Edit Work Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg dark:bg-zinc-900 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold dark:text-zinc-100">Edit Work Order #{job.job_number}</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Customize schedule, dispatch title, or job address</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleEditJob}>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Job Title *
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Detailed Scope / Work Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Scheduled Start Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Scheduled End Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Service Address
                  </label>
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">City</label>
                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="min-h-[44px]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">State</label>
                    <Input value={editState} onChange={(e) => setEditState(e.target.value)} className="min-h-[44px]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Postal Code</label>
                    <Input value={editPostalCode} onChange={(e) => setEditPostalCode(e.target.value)} className="min-h-[44px]" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Internal Dispatch Notes / Gate Codes
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Call customer 15 minutes before arrival. Gate code #4092."
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="min-h-[44px]">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isUpdatingJob} className="min-h-[44px] font-bold">
                  {isUpdatingJob ? 'Saving Changes...' : 'Save Work Order Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteJob}
        title="Delete Work Order"
        entityName={`Job #${job.job_number || job.id.slice(0, 8)}`}
        warningMessage={`Are you sure you want to permanently delete Work Order #${job.job_number}? Any dispatches, technician assignments, and job notes will be removed.`}
      />
    </div>
  );
}
