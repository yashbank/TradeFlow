import React from 'react';
import { notFound } from 'next/navigation';
import { InvoiceService } from '@/services/InvoiceService';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wrench, Phone, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface PublicInvoicePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
  const { token } = await params;
  const invoiceData = await InvoiceService.getByPublicToken(token);

  if (!invoiceData) {
    notFound();
  }

  const invoice = invoiceData as any;
  const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
  const org = Array.isArray(invoice.organization) ? invoice.organization[0] : invoice.organization;
  const isPaid = invoice.status === 'paid' || invoice.balance_due_cents === 0;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Business Branding Header */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg sm:text-xl">
                {org?.name || 'TradeFlow Plumbing'}
              </h1>
              <p className="text-xs text-slate-500">Official Invoice</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={`/api/invoices/${invoice.id}/pdf?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-md hover:bg-slate-200 min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              PDF
            </a>
            {org?.phone && (
              <a
                href={`tel:${org.phone}`}
                className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-md hover:bg-blue-100 min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5" />
                Call Office
              </a>
            )}
          </div>
        </div>

        {/* Paid Stamp Banner */}
        {isPaid ? (
          <div className="bg-emerald-600 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <div>
                <h2 className="text-lg font-bold">PAID IN FULL</h2>
                <p className="text-xs text-emerald-100">Thank you for your business!</p>
              </div>
            </div>
            <span className="text-2xl font-black">
              {formatCurrency(invoice.total_cents, org?.currency)}
            </span>
          </div>
        ) : (
          <div className="bg-blue-600 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 shrink-0 text-blue-200" />
              <div>
                <h2 className="text-lg font-bold">PAYMENT DUE</h2>
                <p className="text-xs text-blue-100">Due Date: {formatDate(invoice.due_date)}</p>
              </div>
            </div>
            <span className="text-2xl font-black">
              {formatCurrency(invoice.balance_due_cents, org?.currency)}
            </span>
          </div>
        )}

        {/* Invoice Card */}
        <Card className="shadow-sm">
          <CardHeader className="p-5 sm:p-8 border-b border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Invoice Number
                </span>
                <h2 className="text-2xl font-black text-slate-900">{invoice.invoice_number}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Issued: <strong>{formatDate(invoice.issue_date)}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(invoice.total_cents, org?.currency)}
                </span>
              </div>
            </div>

            {customer && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-900 block mb-0.5">Billed To:</span>
                {customer.first_name} {customer.last_name} • {customer.address_line1}, {customer.city}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-5 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Items & Services
              </h3>
              <div className="divide-y divide-slate-100">
                {(invoice.items || []).map((item: any) => (
                  <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.total_cents, org?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="border-t border-slate-200 pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal_cents, org?.currency)}</span>
              </div>
              {invoice.discount_cents > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs font-medium">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount_cents, org?.currency)}</span>
                </div>
              )}
              {invoice.tax_cents > 0 && (
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Sales Tax:</span>
                  <span>{formatCurrency(invoice.tax_cents, org?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_cents, org?.currency)}</span>
              </div>
              {invoice.amount_paid_cents > 0 && (
                <div className="flex justify-between text-emerald-600 text-sm font-semibold">
                  <span>Amount Paid:</span>
                  <span>-{formatCurrency(invoice.amount_paid_cents, org?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Balance Due:</span>
                <span className={`text-xl font-black ${isPaid ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {formatCurrency(invoice.balance_due_cents, org?.currency)}
                </span>
              </div>
            </div>

            {invoice.terms && (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                <span className="font-semibold text-slate-700 block mb-1">Payment Instructions:</span>
                {invoice.terms}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
