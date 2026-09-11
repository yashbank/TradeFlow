// ==============================================================================
// src/lib/state/machines.ts — Finite State Machine Transition Guards
// ==============================================================================

import type { QuoteStatus, JobStatus, InvoiceStatus, SubscriptionStatus } from '@/types/database';

export class InvalidStateTransitionError extends Error {
  constructor(entity: string, from: string, to: string) {
    super(`Invalid ${entity} state transition from '${from}' to '${to}'.`);
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Validates and transitions Quote state.
 */
export function transitionQuoteStatus(
  current: QuoteStatus,
  target: QuoteStatus
): QuoteStatus {
  if (current === target) return target;

  const allowedTransitions: Record<QuoteStatus, QuoteStatus[]> = {
    draft: ['sent'],
    sent: ['accepted', 'rejected', 'expired'],
    accepted: [], // Terminal for editing; can spawn jobs
    rejected: ['draft'], // Reopen
    expired: ['draft'],  // Reopen
  };

  if (!allowedTransitions[current]?.includes(target)) {
    throw new InvalidStateTransitionError('Quote', current, target);
  }

  return target;
}

/**
 * Validates and transitions Job state.
 */
export function transitionJobStatus(
  current: JobStatus,
  target: JobStatus
): JobStatus {
  if (current === target) return target;

  const allowedTransitions: Record<JobStatus, JobStatus[]> = {
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // Terminal; can spawn invoices
    cancelled: ['scheduled'], // Re-open
  };

  if (!allowedTransitions[current]?.includes(target)) {
    throw new InvalidStateTransitionError('Job', current, target);
  }

  return target;
}

/**
 * Validates and transitions Invoice state.
 */
export function transitionInvoiceStatus(
  current: InvoiceStatus,
  target: InvoiceStatus,
  hasPaymentsRecorded: boolean = false
): InvoiceStatus {
  if (current === target) return target;

  if (current === 'paid' && target === 'void') {
    throw new Error("Cannot void an invoice in 'paid' status with recorded payments.");
  }

  if (hasPaymentsRecorded && target === 'void') {
    throw new Error("Cannot void an invoice with active payments recorded.");
  }

  const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['sent', 'void'],
    sent: ['paid', 'overdue', 'void'],
    overdue: ['paid', 'void'],
    paid: [], // Strictly immutable
    void: [],
  };

  if (!allowedTransitions[current]?.includes(target)) {
    throw new InvalidStateTransitionError('Invoice', current, target);
  }

  return target;
}

/**
 * Validates and transitions Subscription state.
 */
export function transitionSubscriptionStatus(
  current: SubscriptionStatus,
  target: SubscriptionStatus
): SubscriptionStatus {
  if (current === target) return target;

  const allowedTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
    trialing: ['active', 'past_due', 'canceled'],
    active: ['past_due', 'canceled'],
    past_due: ['active', 'canceled'],
    canceled: ['active'],
    incomplete: ['active', 'canceled'],
  };

  if (!allowedTransitions[current]?.includes(target)) {
    throw new InvalidStateTransitionError('Subscription', current, target);
  }

  return target;
}
