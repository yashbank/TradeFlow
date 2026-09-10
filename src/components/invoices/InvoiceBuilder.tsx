'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { createInvoiceAction, sendInvoiceAction } from '@/actions/invoices';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Sparkles,
  Send,
  Save,
  ArrowLeft,
  Receipt,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { Customer, SupportedCurrency } from '@/types/database';

interface InvoiceBuilderProps {
  customers: Customer[];
  defaultCustomerId?: string;
  taxRateBasisPoints: number;
  currency: SupportedCurrency;
  defaultTerms?: string | null;
}

interface LineItemState {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in main currency units, e.g. 150.00
  taxable: boolean;
}

const PLUMBING_INVOICE_PRESETS = [
  {
    description: 'Standard Plumbing Service Diagnostic & Callout',
    price: 95.0,
    taxable: true,
  },
  {
    description: 'Emergency Pipe Leak Repair & Section Replacement',
    price: 275.0,
    taxable: true,
  },
  {
    description: 'Motorized Main Line Drain Cleanout & Snaking',
    price: 185.0,
    taxable: false, // Labor often non-taxable depending on state
  },
  {
    description: 'Water Heater Heating Element & Thermostat Swap',
    price: 320.0,
    taxable: true,
  },
  {
    description: 'Bathroom Faucet Replacement & Supply Line Hookup',
    price: 210.0,
    taxable: true,
  },
  {
    description: 'Toilet Rebuild (Fluidmaster Valve, Flapper, Bolts)',
    price: 165.0,
    taxable: true,
  },
];

export function InvoiceBuilder({
  customers,
  defaultCustomerId,
  taxRateBasisPoints,
  currency,
  defaultTerms,
}: InvoiceBuilderProps) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(
    defaultCustomerId || (customers[0]?.id || '')
  );

  const today = new Date().toISOString().split('T')[0];
  const net14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(net14);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('Thank you for choosing our plumbing services!');
  const [terms, setTerms] = useState(
    defaultTerms || 'Payment due within 14 days of invoice date. Late fees apply after due date.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<LineItemState[]>([
    {
      id: 'item-1',
      description: 'Plumbing Service Call & Repair Labor',
      quantity: 1,
      unitPrice: 150.0,
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
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      setError('All invoice line items must have a clear description.');
      return;
    }

    if (items.some((i) => i.quantity <= 0)) {
      setError('Line item quantities must be greater than zero.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      customer_id: customerId,
      issue_date: issueDate,
      due_date: dueDate,
      discount_cents: Math.round((Number(discountAmount) || 0) * 100),
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      items: items.map((i) => ({
        description: i.description.trim(),
        quantity: Number(i.quantity),
        unit_price_cents: Math.round((Number(i.unitPrice) || 0) * 100),
        taxable: i.taxable,
      })),
    };

    const res = await createInvoiceAction(payload);

    if (!res.success || !res.data) {
      setLoading(false);
      setError(res.error || 'Failed to generate invoice.');
      return;
    }

    const createdId = res.data.id;

    if (andSend) {
      await sendInvoiceAction(createdId);
    }

    setLoading(false);
    router.push(`/invoices/${createdId}`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Invoices
        </Link>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plumbing Service Presets */}
      <Card className="border-blue-100 bg-blue-50/40">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>1-Click Add Plumbing Service Presets</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLUMBING_INVOICE_PRESETS.map((preset) => (
              <button
                key={preset.description}
                type="button"
                onClick={() => addItem(preset.description, 1, preset.price, preset.taxable)}
                className="text-xs px-3 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50 font-medium transition-colors shadow-xs"
              >
                + {preset.description.split('&')[0]} ({formatCurrency(preset.price * 100, currency)})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Meta Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Receipt className="w-5 h-5 text-blue-600" />
            Invoice Details & Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Issue Date
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="min-h-[44px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-blue-600" />
            Line Items & Services
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addItem()}
            className="min-h-[38px]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Custom Line
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
            >
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 sm:hidden block mb-1">
                  Item Description #{idx + 1}
                </label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="e.g. Cleared main drain blockage with heavy snake"
                  className="min-h-[40px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="w-20">
                  <label className="text-xs font-semibold text-slate-500 sm:hidden block mb-1">
                    Qty
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    className="min-h-[40px] bg-white text-center"
                  />
                </div>

                <div className="w-28">
                  <label className="text-xs font-semibold text-slate-500 sm:hidden block mb-1">
                    Price ({currency})
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="min-h-[40px] bg-white text-right"
                  />
                </div>

                <div className="w-28 text-right font-bold text-slate-800 text-sm hidden sm:block">
                  {formatCurrency(
                    Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * 100),
                    currency
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, 'taxable', !item.taxable)}
                    className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                      item.taxable
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                    title="Taxable item toggle"
                  >
                    {item.taxable ? 'TAX' : 'NO TAX'}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Totals & Calculations Breakdown */}
          <div className="pt-4 border-t border-slate-200 flex flex-col items-end space-y-2 text-sm">
            <div className="flex justify-between w-64 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(calculations.subtotalCents, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between w-64 text-slate-600">
              <span>Discount ({currency}):</span>
              <div className="w-24">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="h-8 text-right text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between w-64 text-slate-600">
              <span>Tax ({(taxRateBasisPoints / 100).toFixed(2)}%):</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(calculations.taxCents, currency)}
              </span>
            </div>

            <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-base font-bold text-slate-900">
              <span>Total Due:</span>
              <span className="text-xl text-blue-600">
                {formatCurrency(calculations.totalCents, currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">
            Invoice Notes & Payment Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Customer Visible Notes
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Thanks for your business!"
              className="min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Payment Terms & Remittance Details
            </label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Desktop Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/invoices">
          <Button variant="outline" type="button" className="min-h-[44px]">
            Cancel
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={loading}
          className="min-h-[44px] font-semibold"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSave(true)}
          disabled={loading}
          className="min-h-[44px] font-bold shadow-sm"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Processing...' : 'Save & Send to Customer'}
        </Button>
      </div>

      {/* Sticky Mobile Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-50 shadow-2xl flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleSave(false)}
          disabled={loading}
          className="flex-1 min-h-[44px]"
        >
          <Save className="w-4 h-4 mr-1" />
          Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => handleSave(true)}
          disabled={loading}
          className="flex-2 min-h-[44px] font-bold"
        >
          <Send className="w-4 h-4 mr-1.5" />
          Save & Send
        </Button>
      </div>
    </div>
  );
}
