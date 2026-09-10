import { describe, it, expect, vi } from 'vitest';
import { CustomerService } from '@/services/CustomerService';
import { QuoteService } from '@/services/QuoteService';
import { AuthService } from '@/services/AuthService';
import * as serverSupabase from '@/lib/supabase/server';

describe('Multi-Tenant Data Isolation (test/integration/tenant-isolation.test.ts)', () => {
  const orgA = { id: 'org_aaa_111', name: "Dave's Plumbing" };
  const userA = { id: 'user_aaa_111', email: 'dave@org-a.com' };

  const orgB = { id: 'org_bbb_222', name: "Bob's Plumbing" };
  const userB = { id: 'user_bbb_222', email: 'bob@org-b.com' };

  it('TC-ISO-01: User in Org B cannot read Customer belonging to Org A', async () => {
    // Authenticated as Org B
    vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
      user: userB as any,
      organization: orgB as any,
      role: 'owner',
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((f1: string, v1: any) => {
            return {
              eq: vi.fn().mockImplementation((f2: string, v2: any) => {
                // Assert that organization_id filter is strictly applied with Org B's ID
                expect(v2).toBe(orgB.id);
                // Return null since customer belongs to Org A
                return {
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
                };
              }),
            };
          }),
        }),
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

    const customer = await CustomerService.getById('cust_belonging_to_org_a');
    expect(customer).toBeNull();
  });

  it('TC-ISO-02: User in Org B cannot create Quote referencing Customer in Org A', async () => {
    // Authenticated as Org B
    vi.spyOn(AuthService, 'requireRole').mockResolvedValue({
      user: userB as any,
      organization: orgB as any,
      role: 'owner',
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((f1: string, custId: any) => {
            return {
              eq: vi.fn().mockImplementation((f2: string, orgId: any) => {
                expect(orgId).toBe(orgB.id);
                // Customer not found in Org B
                return {
                  single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
                };
              }),
            };
          }),
        }),
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

    await expect(
      QuoteService.create({
        customer_id: '11111111-1111-1111-1111-111111111111',
        issue_date: '2026-09-10',
        expiry_date: '2026-10-10',
        discount_cents: 0,
        items: [{ description: 'Test', quantity: 1, unit_price_cents: 1000, taxable: true }],
      })
    ).rejects.toThrow('RESOURCE_NOT_FOUND');
  });
});
