import { describe, it, expect } from 'vitest';
import {
  transitionQuoteStatus,
  transitionJobStatus,
  transitionInvoiceStatus,
  transitionSubscriptionStatus,
  InvalidStateTransitionError,
} from '@/lib/state/machines';

describe('State Machine Transitions (test/unit/state-machines.test.ts)', () => {
  // Quotes
  it('TC-FSM-01: Quote draft -> sent', () => {
    expect(transitionQuoteStatus('draft', 'sent')).toBe('sent');
  });

  it('TC-FSM-02: Quote draft -> accepted is blocked', () => {
    expect(() => transitionQuoteStatus('draft', 'accepted')).toThrow(InvalidStateTransitionError);
  });

  it('TC-FSM-03: Quote sent -> accepted & sent -> rejected', () => {
    expect(transitionQuoteStatus('sent', 'accepted')).toBe('accepted');
    expect(transitionQuoteStatus('sent', 'rejected')).toBe('rejected');
  });

  it('TC-FSM-04: Quote accepted -> draft is blocked (locked)', () => {
    expect(() => transitionQuoteStatus('accepted', 'draft')).toThrow(InvalidStateTransitionError);
  });

  // Jobs
  it('TC-FSM-06: Job scheduled -> completed directly is blocked', () => {
    expect(() => transitionJobStatus('scheduled', 'completed')).toThrow(InvalidStateTransitionError);
  });

  it('TC-FSM-07: Job scheduled -> in_progress -> completed', () => {
    expect(transitionJobStatus('scheduled', 'in_progress')).toBe('in_progress');
    expect(transitionJobStatus('in_progress', 'completed')).toBe('completed');
  });

  // Invoices
  it('TC-FSM-08: Invoice draft -> sent', () => {
    expect(transitionInvoiceStatus('draft', 'sent')).toBe('sent');
  });

  it('TC-FSM-09: Invoice sent -> paid & overdue -> paid', () => {
    expect(transitionInvoiceStatus('sent', 'paid')).toBe('paid');
    expect(transitionInvoiceStatus('overdue', 'paid')).toBe('paid');
  });

  it('TC-FSM-10: Invoice paid -> draft is blocked', () => {
    expect(() => transitionInvoiceStatus('paid', 'draft')).toThrow(InvalidStateTransitionError);
  });

  it('TC-FSM-11: Invoice paid -> void is blocked', () => {
    expect(() => transitionInvoiceStatus('paid', 'void', true)).toThrow();
  });

  // Subscriptions
  it('Subscription transitions trialing -> active -> past_due', () => {
    expect(transitionSubscriptionStatus('trialing', 'active')).toBe('active');
    expect(transitionSubscriptionStatus('active', 'past_due')).toBe('past_due');
  });
});
