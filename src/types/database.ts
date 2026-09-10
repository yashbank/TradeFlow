// ==============================================================================
// src/types/database.ts — Typed Database Schema Definitions
// ==============================================================================

export type UserRole = 'owner' | 'admin' | 'technician';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'other';
export type SupportedCountry = 'US' | 'GB' | 'AU';
export type SupportedCurrency = 'USD' | 'GBP' | 'AUD';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: SupportedCountry;
  currency: SupportedCurrency;
  timezone: string;
  tax_rate_basis_points: number;
  invoice_terms: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string;
  status: SubscriptionStatus;
  trial_start: string;
  trial_end: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string | null;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: SupportedCountry;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  organization_id: string;
  customer_id: string;
  quote_number: string;
  status: QuoteStatus;
  issue_date: string;
  expiry_date: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  notes: string | null;
  terms: string | null;
  public_token: string;
  sent_at: string | null;
  accepted_at: string | null;
  accepted_by_name: string | null;
  accepted_ip: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  organization_id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  taxable: boolean;
  total_cents: number;
  sort_order: number;
  created_at: string;
}

export interface Job {
  id: string;
  organization_id: string;
  customer_id: string;
  source_quote_id: string | null;
  job_number: string;
  title: string;
  description: string | null;
  status: JobStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_to_user_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  internal_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  assigned_to?: UserProfile;
}

export interface Invoice {
  id: string;
  organization_id: string;
  customer_id: string;
  source_job_id: string | null;
  source_quote_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  balance_due_cents: number;
  notes: string | null;
  terms: string | null;
  public_token: string;
  sent_at: string | null;
  paid_at: string | null;
  voided_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  organization_id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  taxable: boolean;
  total_cents: number;
  sort_order: number;
  created_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount_cents: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  changes_json: Record<string, unknown> | null;
  created_at: string;
}
