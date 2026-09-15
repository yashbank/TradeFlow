// ==============================================================================
// src/lib/validations/flowValidation.ts — Pure Domain Flow & Business Logic Validators
// ==============================================================================

export type JobLifecycleStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const VALID_JOB_LIFECYCLE_TRANSITIONS: Record<JobLifecycleStatus, JobLifecycleStatus[]> = {
  pending: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state — cannot reopen to pending, scheduled, or in_progress
  cancelled: ['scheduled'], // Can reopen to scheduled
};

/**
 * Validates a job status transition against strict business lifecycle rules.
 */
export function validateJobStatusTransition(
  from: string,
  to: string
): { valid: boolean; error?: string } {
  const validStatuses: JobLifecycleStatus[] = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
  
  if (!validStatuses.includes(from as JobLifecycleStatus)) {
    return { valid: false, error: "Invalid source status: '" + from + "'" };
  }
  if (!validStatuses.includes(to as JobLifecycleStatus)) {
    return { valid: false, error: "Invalid target status: '" + to + "'" };
  }

  // Idempotent transition is valid
  if (from === to) {
    return { valid: true };
  }

  // Completed is strictly terminal — cannot go back to pending, scheduled, or in_progress
  if (from === 'completed') {
    return {
      valid: false,
      error: "Completed jobs are locked and cannot transition to '" + to + "'.",
    };
  }

  const allowed = VALID_JOB_LIFECYCLE_TRANSITIONS[from as JobLifecycleStatus] || [];
  if (!allowed.includes(to as JobLifecycleStatus)) {
    return {
      valid: false,
      error: "Illegal transition from '" + from + "' to '" + to + "'. Allowed: " + (allowed.join(', ') || 'none'),
    };
  }

  return { valid: true };
}

/**
 * Enforces transition and throws on illegal transitions.
 */
export function transitionJobFlow(from: JobLifecycleStatus, to: JobLifecycleStatus): JobLifecycleStatus {
  const result = validateJobStatusTransition(from, to);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return to;
}

/**
 * Validates that a job satisfies all prerequisites before it can be marked 'completed'.
 * Business Rule: A job MUST have an assigned technician (assigned_to_user_id) for completion.
 */
export function canCompleteJob(job: {
  status?: string;
  assigned_to_user_id?: string | null;
}): { allowed: boolean; error?: string } {
  if (!job) {
    return { allowed: false, error: 'Job object is required.' };
  }

  if (job.status !== 'in_progress') {
    return {
      allowed: false,
      error: "Job must be 'in_progress' to be completed, but current status is '" + (job.status || 'unknown') + "'.",
    };
  }

  if (!job.assigned_to_user_id || typeof job.assigned_to_user_id !== 'string' || job.assigned_to_user_id.trim() === '') {
    return {
      allowed: false,
      error: 'Job requires an assigned technician (assigned_to_user_id) for completion.',
    };
  }

  return { allowed: true };
}

/**
 * Validates an invoice payment against total and balance.
 * Business Rule: An invoice CANNOT be paid more than the total amount.
 */
export function validateInvoicePayment(
  invoice: { total_cents: number; amount_paid_cents: number },
  paymentAmountCents: number
): {
  valid: boolean;
  newPaidCents: number;
  remainingBalanceCents: number;
  isPaidInFull: boolean;
  error?: string;
} {
  if (typeof paymentAmountCents !== 'number' || isNaN(paymentAmountCents) || !isFinite(paymentAmountCents)) {
    return {
      valid: false,
      newPaidCents: invoice.amount_paid_cents,
      remainingBalanceCents: invoice.total_cents - invoice.amount_paid_cents,
      isPaidInFull: false,
      error: 'Payment amount must be a valid number.',
    };
  }

  if (paymentAmountCents <= 0) {
    return {
      valid: false,
      newPaidCents: invoice.amount_paid_cents,
      remainingBalanceCents: invoice.total_cents - invoice.amount_paid_cents,
      isPaidInFull: false,
      error: 'Payment amount must be greater than zero.',
    };
  }

  if (!Number.isInteger(paymentAmountCents)) {
    return {
      valid: false,
      newPaidCents: invoice.amount_paid_cents,
      remainingBalanceCents: invoice.total_cents - invoice.amount_paid_cents,
      isPaidInFull: false,
      error: 'Payment amount must be an integer in cents.',
    };
  }

  const existingPaid = Math.max(0, invoice.amount_paid_cents || 0);
  const total = Math.max(0, invoice.total_cents || 0);
  const remaining = Math.max(0, total - existingPaid);

  if (paymentAmountCents > remaining) {
    return {
      valid: false,
      newPaidCents: existingPaid,
      remainingBalanceCents: remaining,
      isPaidInFull: remaining === 0,
      error: 'Payment amount (' + paymentAmountCents + '¢) exceeds remaining balance (' + remaining + '¢). Invoice cannot be paid more than total.',
    };
  }

  const newPaidCents = existingPaid + paymentAmountCents;
  const remainingBalanceCents = total - newPaidCents;
  const isPaidInFull = remainingBalanceCents === 0;

  return {
    valid: true,
    newPaidCents,
    remainingBalanceCents,
    isPaidInFull,
  };
}

/**
 * Pure calculation of quote line items total.
 * Business Rule: Quote total strictly equals the sum of line items (qty * unit price).
 */
export function calculateQuoteTotals(
  items: Array<{ quantity: number; unit_price_cents: number; taxable?: boolean }>,
  discountCents: number = 0,
  taxRateBasisPoints: number = 0
): {
  sumOfItemsCents: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
} {
  const safeItems = Array.isArray(items) ? items : [];

  const itemTotals = safeItems.map((item) => {
    const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? Math.max(0, item.quantity) : 0;
    const price = typeof item.unit_price_cents === 'number' && !isNaN(item.unit_price_cents) ? Math.max(0, item.unit_price_cents) : 0;
    return Math.round(qty * price);
  });

  const sumOfItemsCents = itemTotals.reduce((a, b) => a + b, 0);
  const subtotalCents = sumOfItemsCents;

  const safeDiscount = typeof discountCents === 'number' && !isNaN(discountCents) ? Math.min(Math.max(0, Math.round(discountCents)), subtotalCents) : 0;
  
  let taxableTotal = 0;
  safeItems.forEach((item, idx) => {
    if (item.taxable !== false) {
      taxableTotal += itemTotals[idx];
    }
  });

  let taxableBase = 0;
  if (subtotalCents > 0 && taxableTotal > 0) {
    const discountPortion = Math.round(safeDiscount * (taxableTotal / subtotalCents));
    taxableBase = Math.max(0, taxableTotal - discountPortion);
  }

  const taxCents = taxRateBasisPoints > 0 ? Math.round((taxableBase * taxRateBasisPoints) / 10000) : 0;
  const totalCents = Math.max(0, subtotalCents - safeDiscount + taxCents);

  return {
    sumOfItemsCents,
    subtotalCents,
    discountCents: safeDiscount,
    taxCents,
    totalCents,
  };
}

/**
 * Validates water chemistry pH value.
 * Business Rule: pH validation range is strictly between 0 and 14 inclusive.
 */
export function validateWaterPH(ph: number): {
  valid: boolean;
  error?: string;
  category?: 'strongly_acidic' | 'acidic' | 'neutral' | 'alkaline' | 'strongly_alkaline';
} {
  if (typeof ph !== 'number' || isNaN(ph) || !isFinite(ph)) {
    return { valid: false, error: 'pH value must be a valid finite number.' };
  }

  if (ph < 0 || ph > 14) {
    return {
      valid: false,
      error: 'pH value ' + ph + ' is outside the standard chemical scale (0-14).',
    };
  }

  let category: 'strongly_acidic' | 'acidic' | 'neutral' | 'alkaline' | 'strongly_alkaline';
  if (ph < 6.5) {
    category = 'strongly_acidic';
  } else if (ph < 7.0) {
    category = 'acidic';
  } else if (ph === 7.0) {
    category = 'neutral';
  } else if (ph <= 7.8) {
    category = 'alkaline';
  } else {
    category = 'strongly_alkaline';
  }

  return { valid: true, category };
}

/**
 * Customer email format validation.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateCustomerEmail(
  email: string | null | undefined,
  options?: { required?: boolean }
): { valid: boolean; error?: string } {
  const isRequired = options?.required ?? false;

  if (email === null || email === undefined || email.trim() === '') {
    if (isRequired) {
      return { valid: false, error: 'Email address is required.' };
    }
    return { valid: true };
  }

  const trimmed = email.trim();

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address exceeds maximum length of 254 characters.' };
  }

  if (!trimmed.includes('@')) {
    return { valid: false, error: 'Email must contain an @ symbol.' };
  }

  if (trimmed.startsWith('@') || trimmed.endsWith('@')) {
    return { valid: false, error: 'Email username or domain cannot be empty.' };
  }

  if (trimmed.includes('..')) {
    return { valid: false, error: 'Email cannot contain consecutive periods.' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid email address format.' };
  }

  return { valid: true };
}

/**
 * Audit log entry shape validator.
 */
export interface AuditLogEntry {
  organization_id: string;
  entity_type: 'quote' | 'job' | 'invoice' | 'customer' | 'technician' | 'organization' | 'payment';
  entity_id: string;
  action: string;
  actor_id: string | null;
  changes_json: Record<string, any>;
  created_at?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_ENTITY_TYPES = ['quote', 'job', 'invoice', 'customer', 'technician', 'organization', 'payment'];

export function validateAuditLogEntry(entry: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return { valid: false, errors: ['Audit log entry must be a non-null object.'] };
  }

  // 1. organization_id
  if (!entry.organization_id || typeof entry.organization_id !== 'string') {
    errors.push('organization_id is required and must be a string.');
  } else if (!UUID_REGEX.test(entry.organization_id)) {
    errors.push('organization_id must be a valid UUID.');
  }

  // 2. entity_type
  if (!entry.entity_type || typeof entry.entity_type !== 'string') {
    errors.push('entity_type is required.');
  } else if (!VALID_ENTITY_TYPES.includes(entry.entity_type)) {
    errors.push('entity_type must be one of: ' + VALID_ENTITY_TYPES.join(', '));
  }

  // 3. entity_id
  if (!entry.entity_id || typeof entry.entity_id !== 'string' || entry.entity_id.trim() === '') {
    errors.push('entity_id is required and must be a non-empty string.');
  }

  // 4. action
  if (!entry.action || typeof entry.action !== 'string' || entry.action.trim() === '') {
    errors.push('action is required and must be a non-empty string.');
  }

  // 5. actor_id
  if (entry.actor_id !== null && entry.actor_id !== undefined) {
    if (typeof entry.actor_id !== 'string' || (!UUID_REGEX.test(entry.actor_id) && entry.actor_id !== 'system')) {
      errors.push("actor_id must be a valid UUID, 'system', or null.");
    }
  }

  // 6. changes_json
  if (
    entry.changes_json === null ||
    entry.changes_json === undefined ||
    typeof entry.changes_json !== 'object' ||
    Array.isArray(entry.changes_json)
  ) {
    errors.push('changes_json must be a non-null plain object.');
  }

  // 7. created_at (if provided)
  if (entry.created_at !== undefined) {
    if (typeof entry.created_at !== 'string' || isNaN(Date.parse(entry.created_at))) {
      errors.push('created_at must be a valid ISO-8601 date string.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
