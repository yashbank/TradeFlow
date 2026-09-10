'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { createQuoteAction, sendQuoteAction } from '@/actions/quotes';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Sparkles, Send, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Customer, SupportedCurrency } from '@/types/database';

interface QuoteBuilderProps {
  customers: Customer[];
  defaultCustomerId?: string;
  taxRateBasisPoints: number;
  currency: SupportedCurrency;
}

interface LineItemState {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in main currency units, e.g. 120.00
  taxable: boolean;
}

export function QuoteBuilder({
  customers,
  defaultCustomerId,
  taxRateBasisPoints,
  currency,
}: QuoteBuilderProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(defaultCustomerId || (customers[0]?.id || ''));
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('Includes 1-year labor warranty.');
  const [terms, setTerms] = useState('Payment due upon completion of plumbing service.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<LineItemState[]>([
    {
      id: 'item-1',
      description: 'Standard Service Call & Diagnostic Inspection',
      quantity: 1,
      unitPrice: 95.0,
      taxable: true,
    },
  ]);

  // Real-time calculation engine preview
  const calculations = useMemo(() => {
    const rawItems = items.map((i) => ({
      quantity: Number(i.quantity) || 0,
      unitPriceCents: Math.round((Number(i.unitPrice) || 0) * 100),
      taxable: i.taxable,
    }));

    const discountCents = Math.round((Number(discountAmount) || 0) * 100);
    return calculateDocumentTotals(rawItems, discountCents, 0, taxRateBasisPoints);
  }, [items, discountAmount, taxRateBasisPoints]);

  function addItem(desc = '', qty = 1, price = 0, taxable = true) {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        description: desc,
        quantity: qty,
        unitPrice: price,
        taxable,
      },
    ]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof LineItemState, value: any) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  async function handleSave(andSend: boolean = false) {
    if (!customerId) {
      setError('Please select or add a customer first.');
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      setError('All line items must have a valid description.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      customer_id: customerId,
      issue_date: issueDate,
      expiry_date: expiryDate,
      discount_cents: Math.round((Number(discountAmount) || 0) * 100),
      notes,
      terms,
      items: items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity) || 1,
        unit_price_cents: Math.round((Number(i.unitPrice) || 0) * 100),
        taxable: i.taxable,
      })),
    };

    const res = await createQuoteAction(payload);
    if (!res.success || !res.data) {
      setLoading(false);
      setError(res.error || 'Failed to create quote.');
      return;
    }

    if (andSend) {
      await sendQuoteAction(res.data.id);
    }

    router.push(`/quotes/${res.data.id}`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/quotes" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Quotes
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={loading}>
            <Save className="w-4 h-4 mr-1.5" />
            Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave(true)} disabled={loading}>
            <Send className="w-4 h-4 mr-1.5" />
            {loading ? 'Processing...' : 'Send Quote'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Customer & Dates Section */}
      <Card className="glass-panel text-card-foreground">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Select Customer *</label>
            {customers.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium py-2">
                No customers found. <Link href="/customers" className="underline font-bold">Add a customer first.</Link>
              </p>
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 shadow-2xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.company_name ? `(${c.company_name})` : ''} - {c.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Issue Date</label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Expiry Date (Valid Until)</label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 1-Tap Quick Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center mr-1">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => addItem('50-Gallon Water Heater Supply & Installation', 1, 1650.0, true)}
          className="text-xs bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 hover:border-sky-400 dark:hover:border-sky-500 px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-zinc-300 transition-colors shadow-2xs"
        >
          + Water Heater ($1,650)
        </button>
        <button
          type="button"
          onClick={() => addItem('Main Sewer Line Snaking & Clear Blockage', 1, 180.0, true)}
          className="text-xs bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 hover:border-sky-400 dark:hover:border-sky-500 px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-zinc-300 transition-colors shadow-2xs"
        >
          + Drain Snaking ($180)
        </button>
        <button
          type="button"
          onClick={() => addItem('Garbage Disposal Replacement', 1, 280.0, true)}
          className="text-xs bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 hover:border-sky-400 dark:hover:border-sky-500 px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-zinc-300 transition-colors shadow-2xs"
        >
          + Garbage Disposal ($280)
        </button>
        <button
          type="button"
          onClick={() => addItem('Plumbing Labor Service (Hourly)', 2, 110.0, true)}
          className="text-xs bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 hover:border-sky-400 dark:hover:border-sky-500 px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-zinc-300 transition-colors shadow-2xs"
        >
          + Labor 2 hrs ($220)
        </button>
      </div>

      {/* Line Items Table Builder */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base font-semibold">Quote Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {items.map((item, index) => {
            const itemTotalCents = calculations.itemTotals[index] || 0;
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 sm:gap-3 items-center bg-slate-50/70 dark:bg-zinc-800/60 p-3 rounded-lg border border-slate-200 dark:border-zinc-700/80"
              >
                <div className="col-span-12 sm:col-span-6">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">
                    Description #{index + 1}
                  </label>
                  <Input
                    placeholder="e.g. 50-Gal Water Heater Supply & Install"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">Qty</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">Unit Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-3 sm:col-span-1 text-center">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1">Tax</label>
                  <input
                    type="checkbox"
                    checked={item.taxable}
                    onChange={(e) => updateItem(item.id, 'taxable', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded mt-2 cursor-pointer"
                  />
                </div>

                <div className="col-span-1 text-right flex items-center justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <Button type="button" variant="outline" size="sm" onClick={() => addItem('', 1, 0, true)} className="mt-2">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Another Line Item
          </Button>
        </CardContent>
      </Card>

      {/* Calculations Summary & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold">Terms & Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Customer Notes / Warranty</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-zinc-700 p-2.5 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Payment Terms</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-zinc-700 p-2.5 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Calculation Totals Box */}
        <Card className="bg-slate-900 dark:bg-zinc-900/95 border border-slate-800 dark:border-zinc-750 text-white">
          <CardHeader className="p-5 pb-3 border-b border-slate-800 dark:border-zinc-800">
            <CardTitle className="text-base font-semibold text-slate-100 dark:text-zinc-100">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm text-slate-400 dark:text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-100 dark:text-zinc-100">
                {formatCurrency(calculations.subtotalCents, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400 dark:text-zinc-400">
              <span>Discount ($):</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-xs text-right bg-slate-800 dark:bg-zinc-800 text-white rounded border border-slate-700 dark:border-zinc-600"
              />
            </div>

            <div className="flex justify-between text-sm text-slate-400 dark:text-zinc-400">
              <span>Tax ({taxRateBasisPoints / 100}%):</span>
              <span className="font-semibold text-slate-100 dark:text-zinc-100">
                {formatCurrency(calculations.taxCents, currency)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 dark:border-zinc-800 flex justify-between items-baseline">
              <span className="text-base font-bold text-white">Total Amount:</span>
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrency(calculations.totalCents, currency)}
              </span>
            </div>
          </CardContent>
          <CardFooter className="p-5 pt-0 flex justify-end gap-2">
            <Button size="lg" className="w-full" onClick={() => handleSave(true)} disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Review & Send Quote'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
