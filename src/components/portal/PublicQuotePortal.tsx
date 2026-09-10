'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { respondToQuotePublicAction } from '@/actions/public-quotes';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle, Phone, Mail, Wrench, ShieldCheck, Download } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';

interface PublicQuotePortalProps {
  quote: any;
  token: string;
}

export function PublicQuotePortal({ quote, token }: PublicQuotePortalProps) {
  const toast = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>(quote.status);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [signerName, setSignerName] = useState(
    quote.customer ? `${quote.customer.first_name} ${quote.customer.last_name}` : ''
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownloadPdf() {
    setDownloading(true);
    toast.info('Downloading Proposal...', 'Preparing PDF file');
    try {
      const res = await fetch(`/api/quotes/${quote.id}/pdf?token=${token}`);
      if (!res.ok) throw new Error('PDF generation failed');
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

  async function handleAccept() {
    if (!signerName.trim()) {
      setError('Please type your full name to approve this quote.');
      toast.error('Name Required', 'Please type your full name to approve this quote');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await respondToQuotePublicAction(token, {
      action: 'accept',
      signer_name: signerName.trim(),
    });

    setLoading(false);
    if (res.success) {
      setCurrentStatus('accepted');
      setShowAcceptModal(false);
      toast.success('Quote Approved!', 'Thank you! The plumbing team will contact you shortly.');
    } else {
      setError(res.error || 'Failed to approve quote');
      toast.error('Approval Error', res.error || 'Failed to approve quote');
    }
  }

  async function handleReject() {
    setLoading(true);
    setError(null);

    const res = await respondToQuotePublicAction(token, {
      action: 'reject',
      rejection_reason: rejectionReason.trim() || undefined,
    });

    setLoading(false);
    if (res.success) {
      setCurrentStatus('rejected');
      setShowRejectModal(false);
      toast.info('Quote Declined', 'Thank you for your feedback.');
    } else {
      setError(res.error || 'Failed to decline quote');
      toast.error('Decline Error', res.error || 'Failed to decline quote');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 py-6 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Plumber Header Banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-zinc-100 text-lg sm:text-xl">
                {quote.organization?.name || 'TradeFlow Plumbing'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Official Plumbing Proposal</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              {downloading ? 'Downloading...' : 'PDF'}
            </Button>
            {quote.organization?.phone && (
              <a
                href={`tel:${quote.organization.phone}`}
                className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/60 min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5" />
                Call Office
              </a>
            )}
          </div>
        </div>

        {/* Accepted Banner */}
        {currentStatus === 'accepted' && (
          <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-md text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 mx-auto" />
            <h2 className="text-xl font-bold">Quote Approved!</h2>
            <p className="text-emerald-100 text-sm">
              Thank you, {signerName || 'valued customer'}. We have received your approval and our team will contact you to confirm your scheduled appointment.
            </p>
          </div>
        )}

        {/* Rejected Banner */}
        {currentStatus === 'rejected' && (
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md text-center space-y-2 animate-in fade-in">
            <XCircle className="w-12 h-12 mx-auto text-slate-400" />
            <h2 className="text-xl font-bold">Quote Declined</h2>
            <p className="text-slate-300 text-sm">
              You have declined this quote. If you need any adjustments or have questions, feel free to give our office a call.
            </p>
          </div>
        )}

        {/* Quote Document Card */}
        <Card className="shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="p-5 sm:p-8 border-b border-slate-100 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Quote Proposal
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-100">{quote.quote_number}</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Valid Until: <strong>{formatDate(quote.expiry_date)}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Estimated Total</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(quote.total_cents, quote.organization?.currency)}
                </span>
              </div>
            </div>

            {quote.customer && (
              <div className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-slate-100 dark:border-zinc-700/80">
                <span className="font-semibold text-slate-900 dark:text-zinc-100 block mb-0.5">Prepared For:</span>
                {quote.customer.first_name} {quote.customer.last_name} • {quote.customer.address_line1}, {quote.customer.city}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-5 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Scope of Work & Materials
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {(quote.items || []).map((item: any) => (
                  <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-zinc-100">{item.description}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {formatCurrency(item.total_cents, quote.organization?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-xs">
                <span>Subtotal:</span>
                <span>{formatCurrency(quote.subtotal_cents, quote.organization?.currency)}</span>
              </div>
              {quote.discount_cents > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <span>Special Discount:</span>
                  <span>-{formatCurrency(quote.discount_cents, quote.organization?.currency)}</span>
                </div>
              )}
              {quote.tax_cents > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-xs">
                  <span>Sales Tax:</span>
                  <span>{formatCurrency(quote.tax_cents, quote.organization?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-zinc-100 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span>Grand Total:</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(quote.total_cents, quote.organization?.currency)}
                </span>
              </div>
            </div>

            {quote.notes && (
              <div className="text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-lg">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Warranty & Service Notes:</span>
                {quote.notes}
              </div>
            )}
          </CardContent>

          {/* Customer Action Bar (Thumb-friendly on mobile) */}
          {['draft', 'sent'].includes(currentStatus) && (
            <CardFooter className="p-5 sm:p-8 pt-0 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                variant="success"
                onClick={() => setShowAcceptModal(true)}
                className="w-full text-base font-bold h-14 rounded-xl shadow-md"
              >
                <ShieldCheck className="w-5 h-5 mr-2" />
                Approve Quote (${(quote.total_cents / 100).toFixed(2)})
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                className="w-full sm:w-auto text-slate-600 dark:text-zinc-300 h-14 rounded-xl"
              >
                Decline
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Accept Confirmation Modal */}
        {showAcceptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-md dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-lg flex items-center dark:text-zinc-100">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                  Confirm Quote Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  By confirming below, you authorize <strong>{quote.organization?.name}</strong> to perform the specified plumbing work for{' '}
                  <strong>{formatCurrency(quote.total_cents, quote.organization?.currency)}</strong>.
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Type your full name to digitally sign:
                  </label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="min-h-[44px]"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button variant="outline" onClick={() => setShowAcceptModal(false)} className="min-h-[44px]">
                  Cancel
                </Button>
                <Button variant="success" onClick={handleAccept} disabled={loading} className="min-h-[44px] font-bold">
                  {loading ? 'Confirming...' : 'Confirm Approval'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Decline Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-md dark:bg-zinc-900 dark:border-zinc-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-lg dark:text-zinc-100">Decline Quote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Let us know if there is anything we can do differently:
                </p>
                <div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional feedback (e.g. found earlier availability, price adjustment needed)..."
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button variant="outline" onClick={() => setShowRejectModal(false)} className="min-h-[44px]">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={loading} className="min-h-[44px] font-bold">
                  {loading ? 'Submitting...' : 'Confirm Decline'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Sticky Mobile Action Bar */}
        {['draft', 'sent'].includes(currentStatus) && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-t border-slate-200 dark:border-zinc-800 z-50 shadow-2xl flex items-center justify-between gap-2">
            <Button
              size="lg"
              variant="success"
              onClick={() => setShowAcceptModal(true)}
              className="flex-2 min-h-[44px] font-bold text-sm"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Approve (${(quote.total_cents / 100).toFixed(2)})
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              className="flex-1 min-h-[44px] text-xs text-slate-600 dark:text-zinc-300"
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
