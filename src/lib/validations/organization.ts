import { z } from 'zod';

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1, 'Business name is required.').max(255),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  address_line1: z.string().max(255).nullable().optional(),
  address_line2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(50).nullable().optional(),
  country: z.enum(['US', 'GB', 'AU']).default('US'),
  currency: z.enum(['USD', 'GBP', 'AUD']).default('USD'),
  timezone: z.string().default('America/New_York'),
  tax_rate_basis_points: z.number().int().min(0).max(5000).default(0), // max 50%
  invoice_terms: z.string().max(2000).nullable().optional(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  role: z.enum(['admin', 'technician']),
});

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
