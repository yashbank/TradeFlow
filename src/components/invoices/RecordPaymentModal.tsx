'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { recordPaymentAction } from '@/actions/invoices';
import { DollarSign, X } from 'lucide-react';
import type { Invoice, PaymentMethod } from '@/types/database';

interface RecordPaymentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export function RecordPaymentModal({ invoice, isOpen, onClose }: RecordPaymentModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(invoice.balance_due_cents / 100);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const amountCents = Math.round(Number(amount) * 100);
    if (amountCents <= 0) {
      setError('Payment amount must be greater than zero.');
      setLoading(false);
      return;
    }

    const res = await recordPaymentAction(invoice.id, {
      amount_cents: amountCents,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to record payment');
    } else {
      onClose();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center">
            <DollarSign className="w-5 h-5 mr-1.5 text-emerald-600" />
            Record Customer Payment
          </CardTitle>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3 pt-2">
            {error && (
              <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Amount ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balance_due_cents / 100}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Balance due: ${(invoice.balance_due_cents / 100).toFixed(2)}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="credit_card">Credit Card (Square / On-Site Reader)</option>
                <option value="bank_transfer">Bank Transfer / Direct Deposit</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Date
              </label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Transaction Reference # / Check #
              </label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TXN-889123 or Check #4402"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Internal Payment Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid on truck via mobile terminal"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
