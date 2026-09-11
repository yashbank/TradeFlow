'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { updateQuoteAction } from '@/actions/quotes';
import { formatCurrency } from '@/lib/utils';
import { Edit, Plus, Trash2, Send, Save, X } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';
import type { Quote } from '@/types/database';

interface EditQuoteModalProps {
  quote: Quote;
}

interface LineItemState {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in standard currency units
  taxable: boolean;
}

export function EditQuoteModal({ quote }: EditQuoteModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [issueDate, setIssueDate] = useState(quote.issue_date || new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(quote.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [discountDollars, setDiscountDollars] = useState<number>((quote.discount_cents || 0) / 100);
  const [notes, setNotes] = useState(quote.notes || '');
  const [terms, setTerms] = useState(quote.terms || '');

  // Initialize line items from quote.items
  const initialItems: LineItemState[] = (quote.items && quote.items.length > 0)
    ? quote.items.map((it: any) => ({
        id: it.id || Math.random().toString(),
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: (it.unit_price_cents || 0) / 100,
        taxable: it.taxable ?? true,
      }))
    : [
        {
          id: '1',
          description: 'Plumbing Service & Diagnostic',
          quantity: 1,
          unitPrice: 120,
          taxable: true,
        },
      ];

  const [items, setItems] = useState<LineItemState[]>(initialItems);

  // Calculations
  const calculatedItems = items.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unit_price_cents: Math.round((i.unitPrice || 0) * 100),
    taxable: i.taxable,
  }));

  const discountCents = Math.round((discountDollars || 0) * 100);
  // Default tax rate basis points: derive from existing tax or 0
  const taxBasisPoints = quote.subtotal_cents > 0 ? Math.round((quote.tax_cents / (quote.subtotal_cents - quote.discount_cents)) * 10000) : 0;
  const calculations = calculateDocumentTotals(calculatedItems, discountCents, 0, taxBasisPoints || 0);

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxable: true,
      },
    ]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) {
      toast.error('Item Required', 'A quote must have at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItem(id: string, field: keyof LineItemState, val: any) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  }

  async function handleSave(resend: boolean) {
    // Validate line items
    for (const it of items) {
      if (!it.description.trim()) {
        setError('All line items must have a description.');
        return;
      }
      if (it.quantity <= 0) {
        setError('Quantity must be greater than zero.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      customer_id: quote.customer_id,
      issue_date: issueDate,
      expiry_date: expiryDate,
      discount_cents: discountCents,
      notes: notes.trim() || null,
      terms: terms.trim() || null,
      items: calculatedItems,
    };

    const res = await updateQuoteAction(quote.id, payload as any, resend);
    setLoading(false);

    if (res.success) {
      toast.success(
        resend ? 'Quote Updated & Sent' : 'Quote Updated',
        resend
          ? `Quote #${quote.quote_number} changes saved and re-sent to customer.`
          : `Quote #${quote.quote_number} changes saved.`
      );
      setIsOpen(false);
      router.refresh();
    } else {
      setError(res.error || 'Failed to update quote.');
      toast.error('Update Failed', res.error || 'Failed to update quote.');
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="min-h-[44px] text-xs font-bold"
      >
        <Edit className="w-3.5 h-3.5 mr-1.5" />
        Edit Quote
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-3xl max-h-[92vh] overflow-y-auto glass-panel-elevated shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-zinc-100">
                  Edit Quote #{quote.quote_number}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Modify scope, line items, pricing, or discount before customer sign-off.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-md border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Issue Date
                  </label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Line Items Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                    Scope of Work & Line Items
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="min-h-[36px] text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <Input
                          placeholder="Item or service description..."
                          value={it.description}
                          onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                          className="flex-1 min-h-[40px] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-0.5">
                            Quantity
                          </label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={it.quantity}
                            onChange={(e) => updateItem(it.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="min-h-[38px] text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-500 dark:text-zinc-400 block mb-0.5">
                            Unit Price ($)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(it.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="min-h-[38px] text-xs"
                          />
                        </div>

                        <div className="text-right flex flex-col justify-end">
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                            Line Total
                          </span>
                          <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                            ${((it.quantity || 0) * (it.unitPrice || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount & Totals Summary */}
              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatCurrency(calculations.subtotalCents)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Discount ($):</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={discountDollars}
                    onChange={(e) => setDiscountDollars(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-24 px-2 py-1 text-right text-xs bg-slate-800 rounded border border-slate-700 text-white"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="font-bold text-white text-sm">Updated Total:</span>
                  <span className="text-xl font-black text-emerald-400">
                    {formatCurrency(calculations.totalCents)}
                  </span>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Customer Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Contract Terms
                  </label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap items-center justify-end gap-2 p-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={loading}
                className="min-h-[44px] font-bold"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                onClick={() => handleSave(true)}
                disabled={loading}
                className="min-h-[44px] font-bold bg-sky-600 hover:bg-sky-700 shadow-xs"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {loading ? 'Processing...' : 'Save & Resend'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
