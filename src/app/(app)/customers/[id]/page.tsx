import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CustomerService } from '@/services/CustomerService';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Receipt,
  Plus,
  ArrowLeft,
  Navigation,
} from 'lucide-react';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await CustomerService.getById(id);

  if (!customer) {
    notFound();
  }

  const timeline = await CustomerService.getTimeline(id);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${customer.address_line1}, ${customer.city}, ${customer.state} ${customer.postal_code}`
  )}`;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link href="/customers" className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>
        <div className="flex items-center gap-2">
          <EditCustomerModal customer={customer} />
          <Link href={`/quotes/new?customer_id=${customer.id}`}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                {customer.first_name} {customer.last_name}
              </h1>
              {customer.company_name && (
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{customer.company_name}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-600 dark:text-zinc-300">
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline min-h-[44px]"
                >
                  <Phone className="w-4 h-4 mr-1.5" />
                  {customer.phone}
                </a>
                {customer.email && (
                  <a
                    href={`mailto:${customer.email}`}
                    className="flex items-center hover:underline min-h-[44px] text-slate-600 dark:text-zinc-300"
                  >
                    <Mail className="w-4 h-4 mr-1.5 text-slate-400 dark:text-zinc-500" />
                    {customer.email}
                  </a>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 min-h-[44px]"
                >
                  <Navigation className="w-4 h-4 mr-1.5 text-slate-400 dark:text-zinc-500" />
                  {customer.address_line1}, {customer.city}, {customer.state} {customer.postal_code}
                </a>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 bg-amber-50/60 dark:bg-zinc-800/80 p-3 rounded-md border border-amber-200 dark:border-zinc-700">
              <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-0.5">Internal Access Notes:</span>
              {customer.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Activity Timeline Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quotes Column */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center text-slate-900 dark:text-zinc-100">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
              Quotes ({timeline.quotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 divide-y divide-slate-100 dark:divide-zinc-800">
            {timeline.quotes.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">No quotes yet.</p>
            ) : (
              timeline.quotes.map((quote: any) => (
                <div key={quote.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <Link href={`/quotes/${quote.id}`} className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {quote.quote_number}
                    </Link>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{formatDate(quote.issue_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">{formatCurrency(quote.total_cents)}</span>
                    <Badge variant={quote.status === 'accepted' ? 'success' : 'secondary'} className="text-[10px] mt-0.5">
                      {quote.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Jobs Column */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center text-slate-900 dark:text-zinc-100">
              <Calendar className="w-4 h-4 mr-1.5 text-purple-600 dark:text-purple-400" />
              Jobs ({timeline.jobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 divide-y divide-slate-100 dark:divide-zinc-800">
            {timeline.jobs.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">No jobs scheduled.</p>
            ) : (
              timeline.jobs.map((job: any) => (
                <div key={job.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <Link href={`/jobs/${job.id}`} className="font-semibold text-sm text-purple-600 dark:text-purple-400 hover:underline truncate block">
                      {job.job_number}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">{job.title}</p>
                  </div>
                  <Badge variant={job.status === 'completed' ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                    {job.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Invoices Column */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center text-slate-900 dark:text-zinc-100">
              <Receipt className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
              Invoices ({timeline.invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 divide-y divide-slate-100 dark:divide-zinc-800">
            {timeline.invoices.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">No invoices issued.</p>
            ) : (
              timeline.invoices.map((inv: any) => (
                <div key={inv.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <Link href={`/invoices/${inv.id}`} className="font-semibold text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                      {inv.invoice_number}
                    </Link>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Due {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">{formatCurrency(inv.total_cents)}</span>
                    <Badge variant={inv.status === 'paid' ? 'success' : 'secondary'} className="text-[10px] mt-0.5">
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
