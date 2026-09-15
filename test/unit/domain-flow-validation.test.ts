import { describe, it, expect, vi } from 'vitest';
import {
  validateJobStatusTransition,
  transitionJobFlow,
  canCompleteJob,
  validateInvoicePayment,
  calculateQuoteTotals,
  validateWaterPH,
  validateCustomerEmail,
  validateAuditLogEntry,
  VALID_JOB_LIFECYCLE_TRANSITIONS,
} from '@/lib/validations/flowValidation';
import { calculateDocumentTotals } from '@/lib/finance/calculator';
import { CustomerSchema } from '@/lib/validations/customer';

describe('Domain Flow & Business Rules Validation Suite (test/unit/domain-flow-validation.test.ts)', () => {
  // ============================================================================
  // Scope 1: Job Lifecycle & Status Transitions
  // ============================================================================
  describe('Scope 1: Job Status Transitions', () => {
    it('001. allows valid initial transition from pending to scheduled', () => {
      const res = validateJobStatusTransition('pending', 'scheduled');
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('002. allows valid dispatch transition from scheduled to in_progress', () => {
      const res = validateJobStatusTransition('scheduled', 'in_progress');
      expect(res.valid).toBe(true);
    });

    it('003. allows valid completion transition from in_progress to completed', () => {
      const res = validateJobStatusTransition('in_progress', 'completed');
      expect(res.valid).toBe(true);
    });

    it('004. strictly blocks illegal transition: completed -> pending', () => {
      const res = validateJobStatusTransition('completed', 'pending');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/locked and cannot transition/i);
    });

    it('005. strictly blocks illegal transition: completed -> in_progress', () => {
      const res = validateJobStatusTransition('completed', 'in_progress');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/locked and cannot transition/i);
    });

    it('006. strictly blocks illegal transition: completed -> scheduled', () => {
      const res = validateJobStatusTransition('completed', 'scheduled');
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/locked and cannot transition/i);
    });

    it('007. blocks illegal jump from pending directly to in_progress', () => {
      const res = validateJobStatusTransition('pending', 'in_progress');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Illegal transition');
    });

    it('008. blocks illegal jump from pending directly to completed', () => {
      const res = validateJobStatusTransition('pending', 'completed');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Illegal transition');
    });

    it('009. allows cancellation from pending, scheduled, and in_progress', () => {
      expect(validateJobStatusTransition('pending', 'cancelled').valid).toBe(true);
      expect(validateJobStatusTransition('scheduled', 'cancelled').valid).toBe(true);
      expect(validateJobStatusTransition('in_progress', 'cancelled').valid).toBe(true);
    });

    it('010. allows reopening a cancelled job back to scheduled', () => {
      const res = validateJobStatusTransition('cancelled', 'scheduled');
      expect(res.valid).toBe(true);
    });

    it('011. rejects unknown or invalid status strings gracefully', () => {
      const res1 = validateJobStatusTransition('invalid_status', 'scheduled');
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain('Invalid source status');

      const res2 = validateJobStatusTransition('scheduled', 'unknown_status');
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain('Invalid target status');
    });

    it('012. transitionJobFlow throws Error on invalid transition and returns target on success', () => {
      expect(transitionJobFlow('scheduled', 'in_progress')).toBe('in_progress');
      expect(() => transitionJobFlow('completed', 'pending')).toThrow(/locked and cannot transition/i);
    });
  });

  // ============================================================================
  // Scope 2: Job Completion Prerequisites (assigned_to_user_id)
  // ============================================================================
  describe('Scope 2: Job Completion Needs assigned_to', () => {
    it('013. allows completion when job is in_progress and has a valid assigned technician', () => {
      const job = {
        status: 'in_progress',
        assigned_to_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };
      const result = canCompleteJob(job);
      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('014. rejects completion when assigned_to_user_id is null', () => {
      const job = {
        status: 'in_progress',
        assigned_to_user_id: null,
      };
      const result = canCompleteJob(job);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('assigned technician');
    });

    it('015. rejects completion when assigned_to_user_id is undefined', () => {
      const job = {
        status: 'in_progress',
        assigned_to_user_id: undefined,
      };
      const result = canCompleteJob(job);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('assigned technician');
    });

    it('016. rejects completion when assigned_to_user_id is an empty string', () => {
      const job = {
        status: 'in_progress',
        assigned_to_user_id: '   ',
      };
      const result = canCompleteJob(job);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('assigned technician');
    });

    it('017. rejects completion when job status is scheduled (not in_progress)', () => {
      const job = {
        status: 'scheduled',
        assigned_to_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };
      const result = canCompleteJob(job);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("must be 'in_progress'");
    });

    it('018. rejects completion when job status is pending', () => {
      const job = {
        status: 'pending',
        assigned_to_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };
      const result = canCompleteJob(job);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("must be 'in_progress'");
    });

    it('019. rejects completion when job object is missing or null', () => {
      expect(canCompleteJob(null as any).allowed).toBe(false);
      expect(canCompleteJob(undefined as any).allowed).toBe(false);
    });

    it('020. preserves assigned_to requirement across multiple technicians', () => {
      const techs = [
        'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      ];
      techs.forEach((techId) => {
        expect(canCompleteJob({ status: 'in_progress', assigned_to_user_id: techId }).allowed).toBe(true);
      });
    });
  });

  // ============================================================================
  // Scope 3: Invoice Payment Rules & Overpayment Rejection
  // ============================================================================
  describe('Scope 3: Invoice Payment Limits & Balance Rules', () => {
    it('021. allows exact full payment of an unpaid invoice', () => {
      const invoice = { total_cents: 25000, amount_paid_cents: 0 };
      const res = validateInvoicePayment(invoice, 25000);
      expect(res.valid).toBe(true);
      expect(res.newPaidCents).toBe(25000);
      expect(res.remainingBalanceCents).toBe(0);
      expect(res.isPaidInFull).toBe(true);
    });

    it('022. allows valid partial payment', () => {
      const invoice = { total_cents: 50000, amount_paid_cents: 10000 };
      const res = validateInvoicePayment(invoice, 15000);
      expect(res.valid).toBe(true);
      expect(res.newPaidCents).toBe(25000);
      expect(res.remainingBalanceCents).toBe(25000);
      expect(res.isPaidInFull).toBe(false);
    });

    it('023. strictly rejects payment exceeding total on fresh invoice (overpayment)', () => {
      const invoice = { total_cents: 10000, amount_paid_cents: 0 };
      const res = validateInvoicePayment(invoice, 10001);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/cannot be paid more than total/i);
      expect(res.newPaidCents).toBe(0);
      expect(res.remainingBalanceCents).toBe(10000);
    });

    it('024. strictly rejects payment exceeding remaining balance on partially paid invoice', () => {
      const invoice = { total_cents: 30000, amount_paid_cents: 20000 }; // 10000 remaining
      const res = validateInvoicePayment(invoice, 12000);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/exceeds remaining balance/i);
    });

    it('025. rejects zero amount payment', () => {
      const invoice = { total_cents: 10000, amount_paid_cents: 0 };
      const res = validateInvoicePayment(invoice, 0);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('greater than zero');
    });

    it('026. rejects negative amount payment', () => {
      const invoice = { total_cents: 10000, amount_paid_cents: 0 };
      const res = validateInvoicePayment(invoice, -500);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('greater than zero');
    });

    it('027. rejects fractional cents / non-integer payment amounts', () => {
      const invoice = { total_cents: 10000, amount_paid_cents: 0 };
      const res = validateInvoicePayment(invoice, 49.99);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('integer in cents');
    });

    it('028. rejects NaN and non-number payment amounts safely', () => {
      const invoice = { total_cents: 10000, amount_paid_cents: 0 };
      expect(validateInvoicePayment(invoice, NaN).valid).toBe(false);
      expect(validateInvoicePayment(invoice, Infinity).valid).toBe(false);
      expect(validateInvoicePayment(invoice, '100' as any).valid).toBe(false);
    });

    it('029. marks invoice as fully paid when remaining balance hits exactly 0', () => {
      const invoice = { total_cents: 45000, amount_paid_cents: 30000 };
      const res = validateInvoicePayment(invoice, 15000);
      expect(res.valid).toBe(true);
      expect(res.isPaidInFull).toBe(true);
      expect(res.remainingBalanceCents).toBe(0);
    });

    it('030. sequential partial payments track balance correctly to completion', () => {
      let inv = { total_cents: 100000, amount_paid_cents: 0 };

      // Step 1: 30000 paid
      let step1 = validateInvoicePayment(inv, 30000);
      expect(step1.valid).toBe(true);
      inv.amount_paid_cents = step1.newPaidCents;

      // Step 2: 40000 paid
      let step2 = validateInvoicePayment(inv, 40000);
      expect(step2.valid).toBe(true);
      inv.amount_paid_cents = step2.newPaidCents;

      // Step 3: Attempt 35000 (exceeds 30000 left) -> rejected
      let overpay = validateInvoicePayment(inv, 35000);
      expect(overpay.valid).toBe(false);

      // Step 4: Pay exact 30000 remainder
      let step4 = validateInvoicePayment(inv, 30000);
      expect(step4.valid).toBe(true);
      expect(step4.isPaidInFull).toBe(true);
      expect(step4.remainingBalanceCents).toBe(0);
    });
  });

  // ============================================================================
  // Scope 4: Quote Total = Sum of Items
  // ============================================================================
  describe('Scope 4: Quote Line Items Total Calculation', () => {
    it('031. calculates single line item total correctly (quantity * unit_price_cents)', () => {
      const items = [{ quantity: 2, unit_price_cents: 5000 }];
      const res = calculateQuoteTotals(items);
      expect(res.sumOfItemsCents).toBe(10000);
      expect(res.subtotalCents).toBe(10000);
      expect(res.totalCents).toBe(10000);
    });

    it('032. calculates multiple line items sum correctly', () => {
      const items = [
        { quantity: 1, unit_price_cents: 15000 },
        { quantity: 3, unit_price_cents: 2500 },
        { quantity: 4, unit_price_cents: 1250 },
      ];
      // 15000 + 7500 + 5000 = 27500
      const res = calculateQuoteTotals(items);
      expect(res.sumOfItemsCents).toBe(27500);
      expect(res.subtotalCents).toBe(27500);
      expect(res.totalCents).toBe(27500);
    });

    it('033. matches pure deterministic finance engine calculateDocumentTotals', () => {
      const items = [
        { quantity: 2, unit_price_cents: 4500, taxable: true },
        { quantity: 1, unit_price_cents: 12000, taxable: true },
      ];
      const customRes = calculateQuoteTotals(items);
      const engineRes = calculateDocumentTotals(items);
      expect(customRes.subtotalCents).toBe(engineRes.subtotalCents);
      expect(customRes.totalCents).toBe(engineRes.totalCents);
    });

    it('034. handles zero line items safely returning 0 total', () => {
      const res = calculateQuoteTotals([]);
      expect(res.sumOfItemsCents).toBe(0);
      expect(res.subtotalCents).toBe(0);
      expect(res.totalCents).toBe(0);
    });

    it('035. handles line item with quantity 0', () => {
      const items = [
        { quantity: 0, unit_price_cents: 10000 },
        { quantity: 2, unit_price_cents: 5000 },
      ];
      const res = calculateQuoteTotals(items);
      expect(res.sumOfItemsCents).toBe(10000);
    });

    it('036. handles line item with unit price 0 (free service or promo)', () => {
      const items = [
        { quantity: 1, unit_price_cents: 0 },
        { quantity: 1, unit_price_cents: 8000 },
      ];
      const res = calculateQuoteTotals(items);
      expect(res.sumOfItemsCents).toBe(8000);
    });

    it('037. applies flat discount correctly without making total negative', () => {
      const items = [{ quantity: 1, unit_price_cents: 10000 }];
      const res = calculateQuoteTotals(items, 3000);
      expect(res.sumOfItemsCents).toBe(10000);
      expect(res.discountCents).toBe(3000);
      expect(res.totalCents).toBe(7000);
    });

    it('038. clamps discount to subtotal if discount exceeds subtotal', () => {
      const items = [{ quantity: 1, unit_price_cents: 5000 }];
      const res = calculateQuoteTotals(items, 99999);
      expect(res.discountCents).toBe(5000);
      expect(res.totalCents).toBe(0);
    });

    it('039. calculates tax basis points (8.25% = 825 bps) correctly', () => {
      const items = [{ quantity: 1, unit_price_cents: 10000, taxable: true }];
      const res = calculateQuoteTotals(items, 0, 825);
      expect(res.taxCents).toBe(825); // 8.25% of 10000
      expect(res.totalCents).toBe(10825);
    });

    it('040. rounds non-integer quantities defensively', () => {
      const items = [{ quantity: 2.5, unit_price_cents: 1000 }];
      const res = calculateQuoteTotals(items);
      expect(res.sumOfItemsCents).toBe(2500);
    });
  });

  // ============================================================================
  // Scope 5: Water Chemistry & pH Scale Validation (0-14)
  // ============================================================================
  describe('Scope 5: pH Validation Range (0-14)', () => {
    it('041. accepts lower boundary pH 0.0 (maximum acidity)', () => {
      const res = validateWaterPH(0);
      expect(res.valid).toBe(true);
      expect(res.category).toBe('strongly_acidic');
    });

    it('042. accepts upper boundary pH 14.0 (maximum alkalinity)', () => {
      const res = validateWaterPH(14);
      expect(res.valid).toBe(true);
      expect(res.category).toBe('strongly_alkaline');
    });

    it('043. accepts neutral pH 7.0', () => {
      const res = validateWaterPH(7.0);
      expect(res.valid).toBe(true);
      expect(res.category).toBe('neutral');
    });

    it('044. accepts ideal plumbing / pool water range 7.2 to 7.8', () => {
      [7.2, 7.4, 7.6, 7.8].forEach((val) => {
        const res = validateWaterPH(val);
        expect(res.valid).toBe(true);
        expect(res.category).toBe('alkaline');
      });
    });

    it('045. rejects negative pH values (< 0)', () => {
      expect(validateWaterPH(-0.1).valid).toBe(false);
      expect(validateWaterPH(-1).valid).toBe(false);
      expect(validateWaterPH(-14).valid).toBe(false);
    });

    it('046. rejects pH values exceeding 14 (> 14)', () => {
      expect(validateWaterPH(14.01).valid).toBe(false);
      expect(validateWaterPH(15).valid).toBe(false);
      expect(validateWaterPH(100).valid).toBe(false);
    });

    it('047. rejects NaN safely', () => {
      const res = validateWaterPH(NaN);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('valid finite number');
    });

    it('048. rejects Infinity and -Infinity safely', () => {
      expect(validateWaterPH(Infinity).valid).toBe(false);
      expect(validateWaterPH(-Infinity).valid).toBe(false);
    });

    it('049. rejects non-numeric types', () => {
      expect(validateWaterPH('7.4' as any).valid).toBe(false);
      expect(validateWaterPH(null as any).valid).toBe(false);
      expect(validateWaterPH(undefined as any).valid).toBe(false);
    });

    it('050. boundary precision: handles 0.001 and 13.999', () => {
      expect(validateWaterPH(0.001).valid).toBe(true);
      expect(validateWaterPH(13.999).valid).toBe(true);
      expect(validateWaterPH(-0.0001).valid).toBe(false);
      expect(validateWaterPH(14.0001).valid).toBe(false);
    });
  });

  // ============================================================================
  // Scope 6: Customer Email Format Validation
  // ============================================================================
  describe('Scope 6: Customer Email Format Validation', () => {
    it('051. accepts standard valid email address', () => {
      expect(validateCustomerEmail('customer@example.com').valid).toBe(true);
      expect(validateCustomerEmail('john.doe@tradeflow.com').valid).toBe(true);
    });

    it('052. accepts valid email with plus addressing and subdomains', () => {
      expect(validateCustomerEmail('service+urgent@plumbing.co.uk').valid).toBe(true);
      expect(validateCustomerEmail('admin@dispatch.staging.tradeflow.io').valid).toBe(true);
    });

    it('053. rejects email missing @ symbol', () => {
      const res = validateCustomerEmail('customerexample.com');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('@');
    });

    it('054. rejects email missing domain', () => {
      const res = validateCustomerEmail('customer@');
      expect(res.valid).toBe(false);
    });

    it('055. rejects email with whitespace or invalid characters', () => {
      expect(validateCustomerEmail('john doe@domain.com').valid).toBe(false);
      expect(validateCustomerEmail('john@domain .com').valid).toBe(false);
    });

    it('056. rejects consecutive periods in domain or username', () => {
      expect(validateCustomerEmail('user..name@domain.com').valid).toBe(false);
      expect(validateCustomerEmail('user@domain..com').valid).toBe(false);
    });

    it('057. respects optional email (null, undefined, or empty string when not required)', () => {
      expect(validateCustomerEmail(null).valid).toBe(true);
      expect(validateCustomerEmail(undefined).valid).toBe(true);
      expect(validateCustomerEmail('').valid).toBe(true);
    });

    it('058. integrates with Zod CustomerSchema email validation rule', () => {
      const validCustomer = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@commercialpools.com',
        phone: '555-0199',
        address_line1: '100 Main St',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
      };
      expect(CustomerSchema.safeParse(validCustomer).success).toBe(true);

      const invalidCustomer = {
        ...validCustomer,
        email: 'not-an-email',
      };
      expect(CustomerSchema.safeParse(invalidCustomer).success).toBe(false);
    });
  });

  // ============================================================================
  // Scope 7: Audit Log Entry Shape Validation
  // ============================================================================
  describe('Scope 7: Audit Log Entry Shape Validation', () => {
    const validEntry = {
      organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      entity_type: 'invoice',
      entity_id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      action: 'payment_recorded',
      actor_id: 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      changes_json: {
        amount_cents: 25000,
        payment_method: 'credit_card',
        balance_due_cents: 0,
      },
      created_at: new Date().toISOString(),
    };

    it('059. accepts fully valid audit log entry', () => {
      const res = validateAuditLogEntry(validEntry);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('060. accepts audit log with null actor_id (system action)', () => {
      const systemEntry = { ...validEntry, actor_id: null };
      const res = validateAuditLogEntry(systemEntry);
      expect(res.valid).toBe(true);
    });

    it('061. rejects audit log missing organization_id or non-UUID organization_id', () => {
      const badEntry1 = { ...validEntry, organization_id: '' };
      expect(validateAuditLogEntry(badEntry1).valid).toBe(false);

      const badEntry2 = { ...validEntry, organization_id: 'not-a-uuid' };
      expect(validateAuditLogEntry(badEntry2).valid).toBe(false);
    });

    it('062. rejects invalid entity_type not in allowed list', () => {
      const badEntry = { ...validEntry, entity_type: 'unknown_entity' };
      const res = validateAuditLogEntry(badEntry);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('entity_type must be one of');
    });

    it('063. validates all allowed entity_types', () => {
      const types = ['quote', 'job', 'invoice', 'customer', 'technician', 'organization', 'payment'];
      types.forEach((type) => {
        const entry = { ...validEntry, entity_type: type };
        expect(validateAuditLogEntry(entry).valid).toBe(true);
      });
    });

    it('064. rejects missing entity_id or empty string entity_id', () => {
      const badEntry = { ...validEntry, entity_id: '   ' };
      expect(validateAuditLogEntry(badEntry).valid).toBe(false);
    });

    it('065. rejects missing action or empty action', () => {
      const badEntry = { ...validEntry, action: '' };
      expect(validateAuditLogEntry(badEntry).valid).toBe(false);
    });

    it('066. rejects non-object or array changes_json', () => {
      expect(validateAuditLogEntry({ ...validEntry, changes_json: null }).valid).toBe(false);
      expect(validateAuditLogEntry({ ...validEntry, changes_json: 'string' }).valid).toBe(false);
      expect(validateAuditLogEntry({ ...validEntry, changes_json: [1, 2, 3] }).valid).toBe(false);
    });

    it('067. rejects invalid ISO-8601 timestamp in created_at', () => {
      const badEntry = { ...validEntry, created_at: 'invalid-date-format' };
      expect(validateAuditLogEntry(badEntry).valid).toBe(false);
    });

    it('068. rejects non-object entry shapes (null, undefined, primitives)', () => {
      expect(validateAuditLogEntry(null).valid).toBe(false);
      expect(validateAuditLogEntry(undefined).valid).toBe(false);
      expect(validateAuditLogEntry('string' as any).valid).toBe(false);
      expect(validateAuditLogEntry([validEntry] as any).valid).toBe(false);
    });
  });
});
