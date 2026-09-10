'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { respondToQuotePublicAction } from '@/actions/public-quotes';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle, Phone, Mail, Wrench, ShieldCheck, Download } from 'lucide-react';

interface PublicQuotePortalProps {
  quote: any;
  token: string;
}

export function PublicQuotePortal({ quote, token }: PublicQuotePortalProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(quote.status);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [signerName, setSignerName] = useState(
    quote.customer ? `${quote.customer.first_name} ${quote.customer.last_name}` : ''
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!signerName.trim()) {
      setError('Please type your full name to approve this quote.');
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
    } else {
      setError(res.error || 'Failed to approve quote');
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
    } else {
      setError(res.error || 'Failed to decline quote');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Plumber Header Banner */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg sm:text-xl">
                {quote.organization?.name || 'TradeFlow Plumbing'}
              </h1>
              <p className="text-xs text-slate-500">Official Plumbing Proposal</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={`/api/quotes/${quote.id}/pdf?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-md hover:bg-slate-200 min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              PDF
            </a>
            {quote.organization?.phone && (
              <a
                href={`tel:${quote.organization.phone}`}
                className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-md hover:bg-blue-100 min-h-[44px]"
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
        <Card className="shadow-sm">
          <CardHeader className="p-5 sm:p-8 border-b border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Quote Proposal
                </span>
                <h2 className="text-2xl font-black text-slate-900">{quote.quote_number}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Valid Until: <strong>{formatDate(quote.expiry_date)}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Estimated Total</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600">
                  {formatCurrency(quote.total_cents, quote.organization?.currency)}
                </span>
              </div>
            </div>

            {quote.customer && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-900 block mb-0.5">Prepared For:</span>
                {quote.customer.first_name} {quote.customer.last_name} • {quote.customer.address_line1}, {quote.customer.city}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-5 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Scope of Work & Materials
              </h3>
              <div className="divide-y divide-slate-100">
                {(quote.items || []).map((item: any) => (
                  <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.total_cents, quote.organization?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="border-t border-slate-200 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Subtotal:</span>
                <span>{formatCurrency(quote.subtotal_cents, quote.organization?.currency)}</span>
              </div>
              {quote.discount_cents > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs font-medium">
                  <span>Special Discount:</span>
                  <span>-{formatCurrency(quote.discount_cents, quote.organization?.currency)}</span>
                </div>
              )}
              {quote.tax_cents > 0 && (
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Sales Tax:</span>
                  <span>{formatCurrency(quote.tax_cents, quote.organization?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="text-xl font-black text-blue-600">
                  {formatCurrency(quote.total_cents, quote.organization?.currency)}
                </span>
              </div>
            </div>

            {quote.notes && (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <span className="font-semibold text-slate-700 block mb-1">Warranty & Service Notes:</span>
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
                className="w-full sm:w-auto text-slate-600 h-14 rounded-xl"
              >
                Decline
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Accept Confirmation Modal */}
        {showAcceptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
                  Confirm Quote Approval
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {error && <p className="text-xs text-red-600">{error}</p>}
                <p className="text-xs text-slate-500">
                  By confirming below, you authorize <strong>{quote.organization?.name}</strong> to perform the specified plumbing work for{' '}
                  <strong>{formatCurrency(quote.total_cents, quote.organization?.currency)}</strong>.
                </p>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Type your full name to digitally sign:
                  </label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
                  Cancel
                </Button>
                <Button variant="success" onClick={handleAccept} disabled={loading}>
                  {loading ? 'Confirming...' : 'Confirm Approval'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Decline Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Decline Quote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {error && <p className="text-xs text-red-600">{error}</p>}
                <p className="text-xs text-slate-500">
                  Let us know if there is anything we can do differently:
                </p>
                <div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional feedback (e.g. found earlier availability, price adjustment needed)..."
                    className="w-full text-xs rounded-md border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={loading}>
                  {loading ? 'Submitting...' : 'Confirm Decline'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
