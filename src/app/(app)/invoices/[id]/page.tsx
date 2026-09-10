import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InvoiceService } from '@/services/InvoiceService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvoiceDetailActions } from '@/components/invoices/InvoiceDetailActions';
import { formatCurrency, formatDate, formatDateTime, getAppBaseUrl } from '@/lib/utils';
import { ArrowLeft, Phone, MapPin, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await InvoiceService.getById(id);

  if (!invoice) {
    notFound();
  }

  const baseUrl = getAppBaseUrl();
  const publicUrl = `${baseUrl}/view/invoice/${invoice.public_token}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/invoices" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
        <InvoiceDetailActions invoice={invoice} publicUrl={publicUrl} />
      </div>

      {/* Paid in Full Banner */}
      {invoice.status === 'paid' && (
        <div className="bg-emerald-600 text-white p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <p className="text-base font-bold">PAID IN FULL</p>
              <p className="text-xs text-emerald-100">
                Payment completed on {formatDateTime(invoice.paid_at)}
              </p>
            </div>
          </div>
          <span className="text-2xl font-black">{formatCurrency(invoice.total_cents)}</span>
        </div>
      )}

      {invoice.status === 'void' && (
        <div className="bg-slate-800 text-slate-200 p-4 rounded-xl flex items-center space-x-3">
          <Ban className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Invoice Voided</p>
            <p className="text-xs text-slate-400">
              This invoice was annulled on {formatDateTime(invoice.voided_at)}.
            </p>
          </div>
        </div>
      )}

      {/* Invoice Document Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{invoice.invoice_number}</h1>
                <Badge
                  variant={
                    invoice.status === 'paid'
                      ? 'success'
                      : invoice.status === 'overdue'
                      ? 'destructive'
                      : invoice.status === 'sent'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Issued {formatDate(invoice.issue_date)} • Due <strong>{formatDate(invoice.due_date)}</strong>
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Balance Due</span>
              <span className={`text-3xl font-black ${invoice.balance_due_cents > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                {formatCurrency(invoice.balance_due_cents)}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Billed To:
            </span>
            <div className="font-bold text-slate-900 text-base">
              {invoice.customer?.first_name} {invoice.customer?.last_name}
              {invoice.customer?.company_name && (
                <span className="font-normal text-slate-500 text-sm ml-2">({invoice.customer.company_name})</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 mt-2">
              <span className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {invoice.customer?.phone}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {invoice.customer?.address_line1}, {invoice.customer?.city}
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
                {(invoice.items || []).map((item) => (
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

          {/* Financial Totals Reconciliation */}
          <div className="border-t border-slate-200 pt-4 flex flex-col items-end space-y-2 text-sm">
            <div className="flex justify-between w-64 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal_cents)}</span>
            </div>
            {invoice.discount_cents > 0 && (
              <div className="flex justify-between w-64 text-emerald-600 font-medium">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount_cents)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 text-slate-600">
              <span>Tax:</span>
              <span className="font-medium text-slate-900">{formatCurrency(invoice.tax_cents)}</span>
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200 font-bold text-slate-900">
              <span>Total Invoiced:</span>
              <span>{formatCurrency(invoice.total_cents)}</span>
            </div>
            <div className="flex justify-between w-64 text-emerald-600 font-semibold">
              <span>Total Paid:</span>
              <span>-{formatCurrency(invoice.amount_paid_cents)}</span>
            </div>
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-base font-bold text-slate-900">
              <span>Balance Due:</span>
              <span className="text-xl font-black text-blue-600">
                {formatCurrency(invoice.balance_due_cents)}
              </span>
            </div>
          </div>

          {/* Payment Receipts Ledger */}
          {(invoice.payments || []).length > 0 && (
            <div className="border-t border-slate-200 pt-6 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recorded Payments Ledger
              </h3>
              <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {invoice.payments?.map((payment) => (
                  <div key={payment.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{formatDate(payment.payment_date)}</span>
                      <span className="text-slate-500 capitalize">{payment.payment_method.replace('_', ' ')}</span>
                      {payment.reference_number && (
                        <span className="text-slate-400 ml-2">Ref: {payment.reference_number}</span>
                      )}
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">
                      {formatCurrency(payment.amount_cents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
