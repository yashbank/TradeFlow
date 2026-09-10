import { z } from 'zod';

export const LineItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.number().positive('Quantity must be greater than 0.'),
  unit_price_cents: z.number().int().nonnegative('Unit price cannot be negative.'),
  taxable: z.boolean().default(true),
});

export const CreateQuoteSchema = z.object({
  customer_id: z.string().uuid('Valid customer ID required.'),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD.'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD.'),
  discount_cents: z.number().int().nonnegative().default(0),
  notes: z.string().max(2000).nullable().optional(),
  terms: z.string().max(2000).nullable().optional(),
  items: z.array(LineItemSchema).min(1, 'At least one line item is required.'),
});

export const PublicQuoteRespondSchema = z.object({
  action: z.enum(['accept', 'reject']),
  signer_name: z.string().min(2, 'Full name is required to approve the quote.').optional(),
  rejection_reason: z.string().max(1000).nullable().optional(),
}).refine(
  (data) => {
    if (data.action === 'accept' && !data.signer_name) {
      return false;
    }
    return true;
  },
  {
    message: 'Full name is required when accepting a quote.',
    path: ['signer_name'],
  }
);

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type LineItemInput = z.infer<typeof LineItemSchema>;
export type PublicQuoteRespondInput = z.infer<typeof PublicQuoteRespondSchema>;
