import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuoteService } from '@/services/QuoteService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuoteDetailActions } from '@/components/quotes/QuoteDetailActions';
import { formatCurrency, formatDate, formatDateTime, getAppBaseUrl } from '@/lib/utils';
import { ArrowLeft, User, Phone, MapPin, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const quote = await QuoteService.getById(id);

  if (!quote) {
    notFound();
  }

  const baseUrl = getAppBaseUrl();
  const publicUrl = `${baseUrl}/view/quote/${quote.public_token}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back button & Action Buttons Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/quotes" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Quotes
        </Link>
        <QuoteDetailActions quote={quote} publicUrl={publicUrl} />
      </div>

      {/* Quote Status Banner */}
      {quote.status === 'accepted' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Quote Approved by Customer</p>
              <p className="text-xs text-emerald-700">
                Signed by {quote.accepted_by_name || 'Customer'} on {formatDateTime(quote.accepted_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {quote.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Quote Declined by Customer</p>
            <p className="text-xs text-red-700">
              {quote.rejection_reason || 'No rejection reason provided.'}
            </p>
          </div>
        </div>
      )}

      {/* Quote Document Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{quote.quote_number}</h1>
                <Badge
                  variant={
                    quote.status === 'accepted'
                      ? 'success'
                      : quote.status === 'sent'
                      ? 'default'
                      : quote.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {quote.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Issued {formatDate(quote.issue_date)} • Valid until {formatDate(quote.expiry_date)}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Total Amount</span>
              <span className="text-3xl font-black text-slate-900">{formatCurrency(quote.total_cents)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Customer Information
            </span>
            <div className="font-bold text-slate-900 text-base">
              {quote.customer?.first_name} {quote.customer?.last_name}
              {quote.customer?.company_name && (
                <span className="font-normal text-slate-500 text-sm ml-2">({quote.customer.company_name})</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 mt-2">
              <span className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {quote.customer?.phone}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {quote.customer?.address_line1}, {quote.customer?.city}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-center w-16">Qty</th>
                  <th className="pb-3 text-right w-24">Unit Price</th>
                  <th className="pb-3 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(quote.items || []).map((item) => (
                  <tr key={item.id} className="text-slate-800">
                    <td className="py-3 font-medium">{item.description}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unit_price_cents)}</td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(item.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="border-t border-slate-200 pt-4 flex flex-col items-end space-y-2 text-sm">
            <div className="flex justify-between w-64 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">{formatCurrency(quote.subtotal_cents)}</span>
            </div>
            {quote.discount_cents > 0 && (
              <div className="flex justify-between w-64 text-emerald-600 font-medium">
                <span>Discount:</span>
                <span>-{formatCurrency(quote.discount_cents)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 text-slate-600">
              <span>Tax:</span>
              <span className="font-medium text-slate-900">{formatCurrency(quote.tax_cents)}</span>
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-base font-bold text-slate-900">
              <span>Total:</span>
              <span className="text-xl font-black">{formatCurrency(quote.total_cents)}</span>
            </div>
          </div>

          {/* Notes & Terms */}
          {(quote.notes || quote.terms) && (
            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500">
              {quote.notes && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Notes:</span>
                  <p>{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Terms & Conditions:</span>
                  <p>{quote.terms}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
