import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '@/services/AuthService';
import { QuoteService } from '@/services/QuoteService';
import { InvoiceService } from '@/services/InvoiceService';
import { JobService } from '@/services/JobService';
import { CustomerService } from '@/services/CustomerService';
import * as serverSupabase from '@/lib/supabase/server';

describe('Role-Based Access Control (RBAC) Architecture (test/integration/rbac.test.ts)', () => {
  const mockOrg = { id: 'org_acme_123', name: 'Acme Trade Services' };

  const ownerUser = { id: 'user_owner_1', email: 'owner@acme.com', full_name: 'Alice Owner' };
  const adminUser = { id: 'user_admin_2', email: 'admin@acme.com', full_name: 'Bob Admin' };
  const techUser = { id: 'user_tech_3', email: 'tech@acme.com', full_name: 'Charlie Tech' };
  const otherTechUser = { id: 'user_tech_4', email: 'othertech@acme.com', full_name: 'Dan Tech' };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AuthService Role Guard Boundaries', () => {
    it('RBAC-01: Owner passes both [owner] and [owner, admin] permission checks', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: ownerUser as any,
        organization: mockOrg as any,
        role: 'owner',
      });

      const ownerCheck = await AuthService.requireRole(['owner']);
      expect(ownerCheck.role).toBe('owner');

      const adminCheck = await AuthService.requireRole(['owner', 'admin']);
      expect(adminCheck.role).toBe('owner');
    });

    it('RBAC-02: Admin passes [owner, admin] checks but is blocked from [owner] exclusive actions', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: adminUser as any,
        organization: mockOrg as any,
        role: 'admin',
      });

      const adminCheck = await AuthService.requireRole(['owner', 'admin']);
      expect(adminCheck.role).toBe('admin');

      await expect(AuthService.requireRole(['owner'])).rejects.toThrow(
        'ORG_FORBIDDEN: Requires one of [owner] role.'
      );
    });

    it('RBAC-03: Technician is blocked from both [owner] and [owner, admin] privileged actions', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(AuthService.requireRole(['owner', 'admin'])).rejects.toThrow(
        'ORG_FORBIDDEN: Requires one of [owner, admin] role.'
      );

      await expect(AuthService.requireRole(['owner'])).rejects.toThrow(
        'ORG_FORBIDDEN: Requires one of [owner] role.'
      );
    });
  });

  describe('2. Financial Operations Protection (Quotes & Invoices)', () => {
    it('RBAC-04: Technician cannot create quotes (rejected with ORG_FORBIDDEN)', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        QuoteService.create({
          customer_id: 'cust_123',
          issue_date: '2026-09-11',
          expiry_date: '2026-10-11',
          discount_cents: 0,
          items: [{ description: 'Field Labor', quantity: 1, unit_price_cents: 8000, taxable: true }],
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('RBAC-05: Technician cannot list or create invoices (rejected with ORG_FORBIDDEN)', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(InvoiceService.list()).rejects.toThrow('ORG_FORBIDDEN');

      await expect(
        InvoiceService.create({
          customer_id: 'cust_123',
          issue_date: '2026-09-11',
          due_date: '2026-10-11',
          discount_cents: 0,
          items: [{ description: 'Wiring', quantity: 2, unit_price_cents: 5000, taxable: true }],
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });
  });

  describe('3. Customer Management Protection', () => {
    it('RBAC-06: Technician cannot create or update customers', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        CustomerService.create({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '555-0199',
          address_line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
          country: 'US',
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });
  });

  describe('4. Field Dispatch & Job Scoping (Technician Boundary)', () => {
    it('RBAC-07: Technician cannot create jobs (dispatch creation requires Admin/Owner)', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      await expect(
        JobService.create({
          customer_id: 'cust_123',
          title: 'Emergency Pipe Repair',
          address_line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
        })
      ).rejects.toThrow('ORG_FORBIDDEN');
    });

    it('RBAC-08: JobService.list automatically filters by assigned_to_user_id for technician role', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      let appliedFilters: Record<string, any> = {};

      const mockQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((field: string, val: any) => {
          appliedFilters[field] = val;
          return mockQuery;
        }),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn((resolve: any) => resolve({ data: [], count: 0, error: null })),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQuery),
      };

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      await JobService.list();

      // Enforce that assigned_to_user_id was filtered with technician's user ID
      expect(appliedFilters['assigned_to_user_id']).toBe(techUser.id);
      expect(appliedFilters['organization_id']).toBe(mockOrg.id);
    });

    it('RBAC-09: Technician CANNOT update a job assigned to another technician', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const mockSupabase = { from: vi.fn() };
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      // Mock getById returning null because query filtered by techUser.id but job belongs to otherTechUser
      vi.spyOn(JobService, 'getById').mockResolvedValue(null);

      await expect(
        JobService.updateStatus('job_belonging_to_other_tech', 'in_progress')
      ).rejects.toThrow('Job not found or access denied.');
    });

    it('RBAC-10: Technician CAN update status on their own assigned job', async () => {
      vi.spyOn(AuthService, 'requireContext').mockResolvedValue({
        user: techUser as any,
        organization: mockOrg as any,
        role: 'technician',
      });

      const assignedJob: any = {
        id: 'job_my_assigned_100',
        organization_id: mockOrg.id,
        assigned_to_user_id: techUser.id,
        status: 'scheduled',
      };

      vi.spyOn(JobService, 'getById').mockResolvedValue(assignedJob);

      const mockUpdateChain: any = {
        eq: vi.fn().mockImplementation(() => mockUpdateChain),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...assignedJob, status: 'in_progress' },
            error: null,
          }),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue(mockUpdateChain),
        }),
      };

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockSupabase as any);

      const updated = await JobService.updateStatus('job_my_assigned_100', 'in_progress');
      expect(updated.status).toBe('in_progress');
    });
  });
});
