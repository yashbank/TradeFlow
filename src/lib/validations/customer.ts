import { z } from 'zod';

export const CustomerSchema = z.object({
  first_name: z.string().min(1, 'First name is required.').max(100),
  last_name: z.string().min(1, 'Last name is required.').max(100),
  company_name: z.string().max(255).nullable().optional(),
  email: z.string().email('Invalid email address.').nullable().optional().or(z.literal('')),
  phone: z.string().min(5, 'Phone number is required.').max(50),
  address_line1: z.string().min(1, 'Address is required.').max(255),
  address_line2: z.string().max(255).nullable().optional().or(z.literal('')),
  city: z.string().min(1, 'City is required.').max(100),
  state: z.string().min(1, 'State/Province is required.').max(100),
  postal_code: z.string().min(2, 'Postal code is required.').max(50),
  country: z.enum(['US', 'GB', 'AU']).default('US'),
  notes: z.string().max(2000).nullable().optional().or(z.literal('')),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
