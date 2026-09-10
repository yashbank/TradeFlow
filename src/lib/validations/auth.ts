import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
  fullName: z.string().min(2, 'Full name is required.'),
  businessName: z.string().min(2, 'Business name is required.'),
  country: z.enum(['US', 'GB', 'AU']).default('US'),
  currency: z.enum(['USD', 'GBP', 'AUD']).default('USD'),
  timezone: z.string().default('America/New_York'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const PasswordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
