import React from 'react';
import Link from 'next/link';
import { QuoteService } from '@/services/QuoteService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, ChevronRight, FileText } from 'lucide-react';
import type { QuoteStatus } from '@/types/database';

interface QuotesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const { status } = await searchParams;
  const validStatus = status as QuoteStatus | undefined;
  const { quotes, totalCount } = await QuoteService.list(validStatus);

  const filterTabs = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & New Quote Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Quotes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalCount} quote records total</p>
        </div>
        <Link href="/quotes/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {filterTabs.map((tab) => {
          const isActive = (!status && tab.value === '') || status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/quotes?status=${tab.value}` : '/quotes'}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Quotes List */}
      <div className="grid grid-cols-1 gap-3">
        {quotes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">No quotes found.</p>
              <Link href="/quotes/new">
                <Button size="sm" variant="outline">
                  Create Quote Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          quotes.map((quote) => (
            <Link key={quote.id} href={`/quotes/${quote.id}`} className="block">
              <Card className="hover:border-blue-400 transition-colors">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{quote.quote_number}</span>
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
                    <p className="text-xs text-slate-600 font-medium truncate">
                      {quote.customer?.first_name} {quote.customer?.last_name}
                      {quote.customer?.company_name && ` (${quote.customer.company_name})`}
                    </p>
                    <p className="text-xs text-slate-400">
                      Issued {formatDate(quote.issue_date)} • Valid until {formatDate(quote.expiry_date)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-bold text-slate-900 block">
                        {formatCurrency(quote.total_cents)}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
