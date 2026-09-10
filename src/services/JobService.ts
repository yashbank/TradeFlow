// ==============================================================================
// src/services/JobService.ts — Job Dispatching & Lifecycle Management
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import { AuthService } from './AuthService';
import { transitionJobStatus } from '@/lib/state/machines';
import type { CreateJobInput } from '@/lib/validations/job';
import type { Job, JobStatus } from '@/types/database';

export class JobService {
  /**
   * Helper to generate sequential job number
   */
  private static async getNextJobNumber(supabase: any, orgId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('fn_next_sequence', {
        p_org_id: orgId,
        p_entity_type: 'job',
      });
      if (data && !error) return data;
    } catch {
      // Fallback
    }

    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const nextVal = (count || 0) + 1;
    return `J-${year}-${String(nextVal).padStart(4, '0')}`;
  }

  /**
   * Lists jobs. Technicians only see their assigned jobs.
   */
  static async list(status?: JobStatus, limit = 50, offset = 0) {
    const { organization, user, role } = await AuthService.requireContext();
    const supabase = await createClient();

    let query = supabase
      .from('jobs')
      .select('*, customer:customers(*), assigned_to:users!jobs_assigned_to_user_id_fkey(*)', { count: 'exact' })
      .eq('organization_id', organization.id)
      .order('scheduled_start', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (role === 'technician') {
      query = query.eq('assigned_to_user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to list jobs: ${error.message}`);
    }

    return {
      jobs: (data || []) as Job[],
      totalCount: count || 0,
    };
  }

  /**
   * Retrieves single job by ID.
   */
  static async getById(jobId: string): Promise<Job | null> {
    const { organization, user, role } = await AuthService.requireContext();
    const supabase = await createClient();

    let query = supabase
      .from('jobs')
      .select('*, customer:customers(*), assigned_to:users!jobs_assigned_to_user_id_fkey(*)')
      .eq('id', jobId)
      .eq('organization_id', organization.id);

    if (role === 'technician') {
      query = query.eq('assigned_to_user_id', user.id);
    }

    const { data, error } = await query.single();
    if (error || !data) return null;
    return data as Job;
  }

  /**
   * Creates a new job manually.
   */
  static async create(input: CreateJobInput): Promise<Job> {
    const { organization, user } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const jobNumber = await this.getNextJobNumber(supabase, organization.id);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        organization_id: organization.id,
        customer_id: input.customer_id,
        source_quote_id: input.source_quote_id || null,
        job_number: jobNumber,
        title: input.title,
        description: input.description || null,
        status: 'scheduled',
        scheduled_start: input.scheduled_start || null,
        scheduled_end: input.scheduled_end || null,
        assigned_to_user_id: input.assigned_to_user_id || null,
        address_line1: input.address_line1,
        address_line2: input.address_line2 || null,
        city: input.city,
        state: input.state,
        postal_code: input.postal_code,
        internal_notes: input.internal_notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create job: ${error?.message}`);
    }

    return data as Job;
  }

  /**
   * Updates job status (Technicians, Admins, and Owners).
   */
  static async updateStatus(jobId: string, targetStatus: JobStatus, internalNotes?: string): Promise<Job> {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    const job = await this.getById(jobId);
    if (!job) throw new Error('Job not found or access denied.');

    // Enforce FSM rules
    transitionJobStatus(job.status, targetStatus);

    const updatePayload: Record<string, any> = {
      status: targetStatus,
    };

    if (targetStatus === 'in_progress' && !job.started_at) {
      updatePayload.started_at = new Date().toISOString();
    }

    if (targetStatus === 'completed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    if (internalNotes) {
      updatePayload.internal_notes = internalNotes;
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update job status: ${error?.message}`);
    }

    return data as Job;
  }

  /**
   * Updates an existing job (title, schedule, assignment, location, notes).
   */
  static async update(
    jobId: string,
    input: Partial<CreateJobInput> & { internal_notes?: string }
  ): Promise<Job> {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const updatePayload: Record<string, any> = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.assigned_to_user_id !== undefined) updatePayload.assigned_to_user_id = input.assigned_to_user_id || null;
    if (input.scheduled_start !== undefined) updatePayload.scheduled_start = input.scheduled_start;
    if (input.scheduled_end !== undefined) updatePayload.scheduled_end = input.scheduled_end;
    if (input.address_line1 !== undefined) updatePayload.address_line1 = input.address_line1;
    if (input.address_line2 !== undefined) updatePayload.address_line2 = input.address_line2;
    if (input.city !== undefined) updatePayload.city = input.city;
    if (input.state !== undefined) updatePayload.state = input.state;
    if (input.postal_code !== undefined) updatePayload.postal_code = input.postal_code;
    if (input.internal_notes !== undefined) updatePayload.internal_notes = input.internal_notes;

    const { data, error } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .eq('organization_id', organization.id)
      .select('*, customer:customers(*), assigned_to:users!jobs_assigned_to_user_id_fkey(*)')
      .single();

    if (error || !data) {
      throw new Error(`Failed to update job: ${error?.message}`);
    }

    return data as Job;
  }

  /**
   * Lists active team members in the organization for technician assignment.
   */
  static async getTeamMembers(): Promise<{ id: string; full_name: string; email: string; role: string }[]> {
    const { organization } = await AuthService.requireContext();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organization_members')
      .select('role, user:users(id, full_name, email)')
      .eq('organization_id', organization.id);

    if (error || !data) return [];

    return data
      .filter((m: any) => m.user)
      .map((m: any) => ({
        id: m.user.id,
        full_name: m.user.full_name || m.user.email,
        email: m.user.email,
        role: m.role,
      }));
  }
}

