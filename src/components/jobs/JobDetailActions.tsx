'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updateJobStatusAction, convertJobToInvoiceAction, updateJobAction, deleteJobAction, assignJobTechnicianAction } from '@/actions/jobs';
import { Play, CheckCircle, Receipt, X, Pencil, Clock, MapPin, Trash2, UserCheck, User, Plus, PenTool, Sparkles, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast/ToastContext';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { serializeTechnicianData, parseTechnicianData, type TechnicianBillItem, type TechnicianPhoto } from '@/lib/jobs/technicianData';
import type { Job } from '@/types/database';

interface JobDetailActionsProps {
  job: Job;
  teamMembers?: { id: string; full_name: string; email: string; role: string }[];
}

export function JobDetailActions({ job, teamMembers = [] }: JobDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Technician Field Submissions
  const initialTechData = useMemo(() => parseTechnicianData(job.internal_notes), [job.internal_notes]);
  const [summaryNotes, setSummaryNotes] = useState(initialTechData.summaryNotes);
  const [billItems, setBillItems] = useState<TechnicianBillItem[]>(initialTechData.billItems);
  const [customerSignerName, setCustomerSignerName] = useState(initialTechData.customerSignerName || '');
  const [customerSignature, setCustomerSignature] = useState(initialTechData.customerSignature || '');
  const [photos, setPhotos] = useState<TechnicianPhoto[]>(initialTechData.photos || []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setCustomerSignature(canvasRef.current.toDataURL());
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCustomerSignature('');
  }

  function addBillItem(desc = '', qty = 1, price = 0, taxable = true) {
    setBillItems((prev) => [
      ...prev,
      {
        id: `tech-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: desc,
        quantity: qty,
        unitPrice: price,
        taxable,
      },
    ]);
  }

  function removeBillItem(id: string) {
    setBillItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateBillItem(id: string, field: keyof TechnicianBillItem, value: any) {
    setBillItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  }

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
  const [editAssignedTo, setEditAssignedTo] = useState<string>(job.assigned_to_user_id || '');
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
    const serializedNotes = serializeTechnicianData({
      summaryNotes: summaryNotes.trim(),
      customerSignerName: customerSignerName.trim() || undefined,
      customerSignature: customerSignature || undefined,
      signedAt: customerSignature || customerSignerName ? new Date().toISOString() : undefined,
      photos,
      billItems,
    });

    const res = await updateJobStatusAction(job.id, 'completed', serializedNotes);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to complete job');
      toast.error('Completion Failed', res.error || 'Failed to complete job');
    } else {
      toast.success('Job Completed', `Work order #${job.job_number || ''} marked complete with field additions`);
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
      assigned_to_user_id: editAssignedTo === '' ? null : editAssignedTo,
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
        {/* Quick Technician Reassignment Selector */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 min-h-[44px]">
          <UserCheck className="w-4 h-4 text-sky-500 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
              {t('jobs.assigned_to') || 'Assigned Tech'}
            </span>
            <select
              className="bg-transparent dark:bg-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer pr-2 border-0 dark:border-zinc-700"
              value={job.assigned_to_user_id || ''}
              onChange={async (e) => {
                const newTechId = e.target.value || null;
                setLoading(true);
                const res = await assignJobTechnicianAction(job.id, newTechId);
                setLoading(false);
                if (res.success) {
                  toast.success('Technician Assigned', 'Work order dispatch updated.');
                  router.refresh();
                } else {
                  toast.error('Assignment Failed', res.error || 'Failed to assign technician');
                }
              }}
              disabled={loading}
            >
              <option value="" className="text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">
                -- {t('jobs.unassigned_pool') || 'Unassigned (Pool)'} --
              </option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id} className="text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">
                  {m.full_name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowEditModal(true)}
          className="min-h-[44px]"
        >
          <Pencil className="w-4 h-4 mr-1.5 text-slate-500 dark:text-zinc-400" />
          {t('jobs.edit_title') || 'Edit Work Order'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-xl dark:bg-zinc-900 dark:border-zinc-800 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold dark:text-zinc-100">Complete Work Order #{job.job_number}</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Record technician notes, billable field items & customer signature</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-5 pt-4 flex-1">
              {/* 1. Work Summary Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                  Technician Work Summary & Diagnostic Notes *
                </label>
                <textarea
                  rows={3}
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="e.g. Replaced faulty pressure relief valve and flushed line. Verified pressure at 60 PSI."
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* 2. Billable Field Items & Extra Labor */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Field Additions & Billable Items ({billItems.length})
                    </span>
                  </div>
                  {billItems.length > 0 && (
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      Subtotal: ${(billItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0)).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Add parts used or extra labor on-site. These automatically flow into the invoice when converted or imported!
                </p>

                {/* Quick Addition Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => addBillItem('Standard Diagnostic & Service Callout', 1, 95.0, true)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Diagnostic ($95)
                  </button>
                  <button
                    type="button"
                    onClick={() => addBillItem('Additional On-Site Labor Hour', 1, 110.0, false)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Extra Labor ($110)
                  </button>
                  <button
                    type="button"
                    onClick={() => addBillItem('Emergency After-Hours Service Surcharge', 1, 150.0, true)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Emergency ($150)
                  </button>
                  <button
                    type="button"
                    onClick={() => addBillItem('Replacement Brass Valve & Fitting', 1, 85.0, true)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Valve Part ($85)
                  </button>
                  <button
                    type="button"
                    onClick={() => addBillItem('', 1, 0, true)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Custom Item
                  </button>
                </div>

                {/* Items List */}
                {billItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {billItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs"
                      >
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateBillItem(item.id, 'description', e.target.value)}
                          placeholder="Item or Labor Description"
                          className="flex-1 w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-zinc-100"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Qty:</span>
                            <input
                              type="number"
                              min="0.25"
                              step="0.25"
                              value={item.quantity}
                              onChange={(e) => updateBillItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-14 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-zinc-100 text-center"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateBillItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-18 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-zinc-100 text-right font-medium"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.taxable}
                              onChange={(e) => updateBillItem(item.id, 'taxable', e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            Tax
                          </label>
                          <button
                            type="button"
                            onClick={() => removeBillItem(item.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Customer Signature on Glass */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-zinc-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                      Customer Sign-off on Glass (Digital Signature)
                    </span>
                  </div>
                  {customerSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      Clear Signature
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                    Customer Full Name
                  </label>
                  <Input
                    value={customerSignerName}
                    onChange={(e) => setCustomerSignerName(e.target.value)}
                    placeholder="e.g. Arya Yadav"
                    className="min-h-[38px] text-xs"
                  />
                </div>

                <div className="relative border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[120px] touch-none cursor-crosshair"
                  />
                  {!customerSignature && !isDrawing && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 dark:text-zinc-500 text-xs">
                      Sign on line with finger or stylus ✍️
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-zinc-800 sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
              <Button variant="outline" onClick={() => setShowCompleteModal(false)} className="min-h-[44px]">
                Cancel
              </Button>
              <Button variant="success" onClick={handleComplete} disabled={loading} className="min-h-[44px] font-bold">
                {loading ? 'Completing...' : 'Mark Completed & Save Scope'}
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    {t('jobs.assigned_to') || 'Assign Technician / Crew Member'}
                  </label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 p-2.5 min-h-[44px] focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- {t('jobs.unassigned_pool') || 'Unassigned (Pool Queue)'} --</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Assigning a technician pushes this work order into their live mobile dispatch queue.
                  </p>
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
