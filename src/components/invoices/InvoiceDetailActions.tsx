'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RecordPaymentModal } from './RecordPaymentModal';
import { sendInvoiceAction, voidInvoiceAction } from '@/actions/invoices';
import { Send, DollarSign, Ban, Copy, Check, ExternalLink, Download } from 'lucide-react';
import type { Invoice } from '@/types/database';

interface InvoiceDetailActionsProps {
  invoice: Invoice;
  publicUrl: string;
}

export function InvoiceDetailActions({ invoice, publicUrl }: InvoiceDetailActionsProps) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSend() {
    setLoading(true);
    setError(null);
    const res = await sendInvoiceAction(invoice.id);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to send invoice');
    } else {
      router.refresh();
    }
  }

  async function handleVoid() {
    if (!confirm('Are you sure you want to void this invoice? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError(null);
    const res = await voidInvoiceAction(invoice.id);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to void invoice');
    } else {
      router.refresh();
    }
  }

  const canRecordPayment = invoice.status !== 'paid' && invoice.status !== 'void' && invoice.balance_due_cents > 0;

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyLink} className="min-h-[44px]">
          {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
          {copied ? 'Link Copied!' : 'Copy Link'}
        </Button>

        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" className="min-h-[44px]">
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Public View
          </Button>
        </a>

        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="min-h-[44px]">
            <Download className="w-4 h-4 mr-1.5 text-slate-600" />
            Download PDF
          </Button>
        </a>

        {invoice.status === 'draft' && (
          <Button size="sm" onClick={handleSend} disabled={loading} className="min-h-[44px]">
            <Send className="w-4 h-4 mr-1.5" />
            {loading ? 'Sending...' : 'Send Invoice'}
          </Button>
        )}

        {canRecordPayment && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setShowPaymentModal(true)}
            className="min-h-[44px] shadow-sm font-semibold"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Record Payment
          </Button>
        )}

        {invoice.status !== 'paid' && invoice.status !== 'void' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleVoid}
            disabled={loading}
            className="text-slate-400 hover:text-red-600 min-h-[44px]"
          >
            <Ban className="w-4 h-4 mr-1" />
            Void
          </Button>
        )}
      </div>

      {/* Sticky Mobile Thumb-Zone Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-50 shadow-2xl flex items-center justify-between gap-2">
        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="outline" size="sm" className="w-full min-h-[44px]">
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </a>

        {invoice.status === 'draft' && (
          <Button
            size="sm"
            onClick={handleSend}
            disabled={loading}
            className="flex-2 min-h-[44px] font-bold"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Send Invoice
          </Button>
        )}

        {canRecordPayment && (
          <Button
            size="sm"
            variant="success"
            onClick={() => setShowPaymentModal(true)}
            className="flex-2 min-h-[44px] font-bold shadow-sm"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Record Payment
          </Button>
        )}
      </div>

      <RecordPaymentModal
        invoice={invoice}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}
