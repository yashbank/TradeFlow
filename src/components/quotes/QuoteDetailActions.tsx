'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { sendQuoteAction, convertQuoteToJobAction } from '@/actions/quotes';
import { Send, CalendarCheck2, Copy, Check, ExternalLink, Download } from 'lucide-react';
import type { Quote } from '@/types/database';

interface QuoteDetailActionsProps {
  quote: Quote;
  publicUrl: string;
}

export function QuoteDetailActions({ quote, publicUrl }: QuoteDetailActionsProps) {
  const router = useRouter();
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
    const res = await sendQuoteAction(quote.id);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to send quote');
    } else {
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
    } else {
      router.push(`/jobs/${res.data.id}`);
    }
  }

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
          {copied ? 'Link Copied!' : 'Copy Approval Link'}
        </Button>

        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" className="min-h-[44px]">
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View Portal
          </Button>
        </a>

        <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="min-h-[44px]">
            <Download className="w-4 h-4 mr-1.5 text-slate-600" />
            Download PDF
          </Button>
        </a>

        {quote.status === 'draft' && (
          <Button size="sm" onClick={handleSend} disabled={loading} className="min-h-[44px]">
            <Send className="w-4 h-4 mr-1.5" />
            {loading ? 'Sending...' : 'Send to Customer'}
          </Button>
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
      </div>
    </div>
  );
}
