import { z } from 'zod';

export const CreateJobSchema = z.object({
  customer_id: z.string().uuid('Valid customer ID required.'),
  source_quote_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Title is required.').max(255),
  description: z.string().max(3000).nullable().optional(),
  scheduled_start: z.string().nullable().optional(),
  scheduled_end: z.string().nullable().optional(),
  assigned_to_user_id: z.string().uuid().nullable().optional(),
  address_line1: z.string().min(1, 'Address is required.').max(255),
  address_line2: z.string().max(255).nullable().optional(),
  city: z.string().min(1, 'City is required.').max(100),
  state: z.string().min(1, 'State is required.').max(100),
  postal_code: z.string().min(2, 'Postal code is required.').max(50),
  internal_notes: z.string().max(3000).nullable().optional(),
});

export const UpdateJobStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  internal_notes: z.string().max(3000).nullable().optional(),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof UpdateJobStatusSchema>;
