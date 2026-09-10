import { z } from 'zod';
import { LineItemSchema } from './quote';

export const CreateInvoiceSchema = z.object({
  customer_id: z.string().uuid('Valid customer ID required.'),
  source_job_id: z.string().uuid().nullable().optional(),
  source_quote_id: z.string().uuid().nullable().optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD.'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD.'),
  discount_cents: z.number().int().nonnegative().default(0),
  notes: z.string().max(2000).nullable().optional(),
  terms: z.string().max(2000).nullable().optional(),
  items: z.array(LineItemSchema).min(1, 'At least one line item is required.'),
});

export const RecordPaymentSchema = z.object({
  amount_cents: z.number().int().positive('Payment amount must be greater than zero.'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD.'),
  payment_method: z.enum(['credit_card', 'bank_transfer', 'cash', 'check', 'other']),
  reference_number: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
