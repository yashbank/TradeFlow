'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  sendQuoteAction,
  convertQuoteToJobAction,
  approveQuoteAction,
  rejectQuoteAction,
  deleteQuoteAction,
} from '@/actions/quotes';
import {
  Send,
  CalendarCheck2,
  Copy,
  Check,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  X,
  PhoneCall,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';
import { EditQuoteModal } from './EditQuoteModal';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import type { Quote } from '@/types/database';

interface QuoteDetailActionsProps {
  quote: Quote;
  publicUrl: string;
}

export function QuoteDetailActions({ quote, publicUrl }: QuoteDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signerName, setSignerName] = useState(
    `${quote.customer?.first_name || ''} ${quote.customer?.last_name || ''}`.trim()
  );
  const [approvalMethod, setApprovalMethod] = useState('Verbal / Phone Approval');
  const [autoConvert, setAutoConvert] = useState(true);
  const [declineReason, setDeclineReason] = useState('Price too high / Budget mismatch');

  async function handleDeleteQuote() {
    const res = await deleteQuoteAction(quote.id);
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete quote');
    }
    toast.success('Quote Deleted', `Quote ${quote.quote_number} has been removed.`);
    router.push('/quotes');
  }

  function copyLink() {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/view/quote/${quote.public_token}`
      : publicUrl;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link Copied', 'Approval link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    toast.info('Downloading Quote...', 'Preparing PDF proposal');
    try {
      const endpoint = quote.public_token
        ? `/api/quotes/${quote.id}/pdf?token=${quote.public_token}&download=1`
        : `/api/quotes/${quote.id}/pdf?download=1`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || 'PDF generation failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote.quote_number || quote.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Quote Downloaded', 'PDF saved to your device');
    } catch (err: any) {
      toast.error('Download Failed', err.message || 'Could not download PDF');
    } finally {
      setDownloading(false);
    }
  }

  async function handleSend() {
    setLoading(true);
    setError(null);
    const res = await sendQuoteAction(quote.id);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to send quote');
      toast.error('Failed to Send', res.error || 'Failed to send quote');
    } else {
      toast.success('Quote Sent', 'Customer has received the proposal');
      router.refresh();
    }
  }

  async function handleApprove() {
    setLoading(true);
    setError(null);
    const res = await approveQuoteAction(quote.id, signerName, approvalMethod);
    if (!res.success) {
      setLoading(false);
      setError(res.error || 'Failed to approve quote');
      toast.error('Approval Failed', res.error || 'Failed to approve quote');
      return;
    }

    toast.success('Quote Approved', 'Proposal has been approved');

    if (autoConvert) {
      const convRes = await convertQuoteToJobAction(quote.id);
      setLoading(false);
      if (convRes.success && convRes.data) {
        toast.success('Job Created', `Job #${convRes.data.job_number || ''} created from quote`);
        router.push(`/jobs/${convRes.data.id}`);
        return;
      }
    }

    setLoading(false);
    setShowApproveModal(false);
    router.refresh();
  }

  async function handleDecline() {
    setLoading(true);
    setError(null);
    const res = await rejectQuoteAction(quote.id, declineReason);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to decline quote');
      toast.error('Decline Failed', res.error || 'Failed to decline quote');
    } else {
      toast.info('Quote Declined', 'Quote marked as rejected');
      setShowDeclineModal(false);
      router.refresh();
    }
  }

  async function handleConvertToJob() {
    setLoading(true);
    setError(null);
    const res = await convertQuoteToJobAction(quote.id);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || 'Failed to convert quote to job');
      toast.error('Conversion Failed', res.error || 'Failed to convert quote');
    } else {
      toast.success('Job Created', `Work order #${res.data.job_number || ''} is now active`);
      router.push(`/jobs/${res.data.id}`);
    }
  }

  const isPending = quote.status === 'draft' || quote.status === 'sent';

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Desktop Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyLink} className="min-h-[44px]">
          {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
          {copied ? 'Link Copied!' : 'Copy Approval Link'}
        </Button>

        <a href={`/view/quote/${quote.public_token}`} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" className="min-h-[44px]">
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View Portal
          </Button>
        </a>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="min-h-[44px]"
        >
          <Download className="w-4 h-4 mr-1.5 text-slate-600" />
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>

        {quote.status === 'draft' && (
          <Button variant="outline" size="sm" onClick={handleSend} disabled={loading} className="min-h-[44px]">
            <Send className="w-4 h-4 mr-1.5" />
            {loading ? 'Sending...' : 'Send to Customer'}
          </Button>
        )}

        {isPending && (
          <>
            <EditQuoteModal quote={quote} />
            <Button
              size="sm"
              variant="success"
              onClick={() => setShowApproveModal(true)}
              disabled={loading}
              className="min-h-[44px] font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Approve Quote
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeclineModal(true)}
              disabled={loading}
              className="min-h-[44px] text-slate-500 hover:text-red-600"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Decline
            </Button>
          </>
        )}

        {quote.status === 'accepted' && (
          <Button
            size="sm"
            variant="success"
            onClick={handleConvertToJob}
            disabled={loading}
            className="min-h-[44px] shadow-sm font-semibold"
          >
            <CalendarCheck2 className="w-4 h-4 mr-1.5" />
            {loading ? 'Converting...' : 'Convert to Active Job'}
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-50 shadow-2xl dark:bg-zinc-900/95 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="w-full min-h-[44px]"
          >
            <Download className="w-4 h-4 mr-1" />
            {downloading ? 'PDF...' : 'PDF'}
          </Button>
        </div>

        {isPending && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setShowApproveModal(true)}
            disabled={loading}
            className="flex-2 min-h-[44px] font-bold"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Approve Quote
          </Button>
        )}

        {quote.status === 'accepted' && (
          <Button
            size="sm"
            variant="success"
            onClick={handleConvertToJob}
            disabled={loading}
            className="flex-2 min-h-[44px] font-bold"
          >
            <CalendarCheck2 className="w-4 h-4 mr-1.5" />
            Convert to Job
          </Button>
        )}
      </div>

      {/* In-App Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold dark:text-zinc-100">Approve Quote {quote.quote_number}</CardTitle>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Record customer approval immediately without waiting for portal signature. Ideal for verbal phone orders or on-site agreements.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Customer Signer Name
                </label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Approval Method
                </label>
                <select
                  value={approvalMethod}
                  onChange={(e) => setApprovalMethod(e.target.value)}
                  className="w-full h-11 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Verbal / Phone Approval">Verbal / Phone Approval</option>
                  <option value="On-Site Verbal Agreement">On-Site Verbal Agreement</option>
                  <option value="Customer Email Confirmation">Customer Email Confirmation</option>
                  <option value="Signed Paper Work Order">Signed Paper Work Order</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoConvert"
                  checked={autoConvert}
                  onChange={(e) => setAutoConvert(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="autoConvert" className="text-xs font-medium text-emerald-900 dark:text-emerald-300 cursor-pointer">
                  Automatically dispatch / convert to Active Job now
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApproveModal(false)}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="success"
                onClick={handleApprove}
                disabled={loading}
                className="min-h-[44px] font-bold"
              >
                {loading ? 'Approving...' : 'Confirm & Approve'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* In-App Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold dark:text-zinc-100">Decline Quote {quote.quote_number}</CardTitle>
              </div>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Mark this quote as declined. You can reopen or duplicate it later if requirements change.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Reason for Decline
                </label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full h-11 px-3 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Price too high / Budget mismatch">Price too high / Budget mismatch</option>
                  <option value="Selected another plumbing provider">Selected another plumbing provider</option>
                  <option value="Customer decided to delay/cancel repair">Customer decided to delay/cancel repair</option>
                  <option value="Scheduling/Timing mismatch">Scheduling/Timing mismatch</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeclineModal(false)}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDecline}
                disabled={loading}
                className="min-h-[44px] font-bold"
              >
                {loading ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteQuote}
        title="Delete Quote"
        entityName={`Quote ${quote.quote_number}`}
        warningMessage={`Are you sure you want to permanently delete Quote ${quote.quote_number}? All line items associated with this proposal will be removed.`}
      />
    </div>
  );
}
