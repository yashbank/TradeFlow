import React from 'react';
import { notFound } from 'next/navigation';
import { QuoteService } from '@/services/QuoteService';
import { PublicQuotePortal } from '@/components/portal/PublicQuotePortal';

interface PublicQuotePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { token } = await params;
  const quote = await QuoteService.getByPublicToken(token);

  if (!quote) {
    notFound();
  }

  return <PublicQuotePortal quote={quote} token={token} />;
}
