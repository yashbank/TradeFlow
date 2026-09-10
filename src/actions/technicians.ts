'use server';

import { AuthService } from '@/services/AuthService';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface TechnicianInfo {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  activeJobsCount: number;
  createdAt: string;
}

/**
 * Creates a new field technician account under the owner's organization.
 * The technician is provisioned with real credentials and can log in immediately.
 */
export async function createTechnicianAction(formData: FormData) {
  try {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);

    const fullName = (formData.get('fullName') as string)?.trim();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const password = (formData.get('password') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || null;

    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Please enter a valid full name (min 2 characters).' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const adminClient = createAdminClient();

    // 1. Create or retrieve auth user via Supabase Admin GoTrue API
    let userId: string;
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
      },
    });

    if (authError) {
      // If user already exists in auth, look them up
      if (authError.message?.toLowerCase().includes('already') || authError.message?.toLowerCase().includes('registered')) {
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const found = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email);
        if (!found) {
          return { success: false, error: authError.message };
        }
        userId = found.id;
      } else {
        return { success: false, error: authError.message };
      }
    } else {
      userId = authUser.user.id;
    }

    // 2. Upsert record in public.users
    const { error: userUpsertError } = await adminClient.from('users').upsert({
      id: userId,
      full_name: fullName,
      email,
      phone,
    });

    if (userUpsertError) {
      console.warn('public.users upsert notice:', userUpsertError.message);
    }

    // 3. Link user as technician to the organization in organization_members
    const { error: memberError } = await adminClient.from('organization_members').upsert(
      {
        organization_id: organization.id,
        user_id: userId,
        role: 'technician',
      },
      { onConflict: 'organization_id,user_id' }
    );

    if (memberError) {
      return { success: false, error: `Failed to link technician to workspace: ${memberError.message}` };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/jobs');

    return {
      success: true,
      message: `Technician ${fullName} created successfully! They can now log in with ${email}.`,
      technician: {
        userId,
        fullName,
        email,
        phone,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while provisioning the technician.',
    };
  }
}

/**
 * Lists all active field technicians under the current owner's organization,
 * including active work orders assigned to each.
 */
export async function listTechniciansAction(): Promise<{ success: boolean; data?: TechnicianInfo[]; error?: string }> {
  try {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    // Query members with role = technician
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('id, user_id, role, created_at, user:users(id, full_name, email, phone)')
      .eq('organization_id', organization.id)
      .eq('role', 'technician');

    if (error) {
      return { success: false, error: error.message };
    }

    // Get active job counts per technician
    const { data: activeJobs } = await supabase
      .from('jobs')
      .select('assigned_to_user_id')
      .eq('organization_id', organization.id)
      .in('status', ['scheduled', 'in_progress']);

    const jobCounts: Record<string, number> = {};
    if (activeJobs) {
      for (const job of activeJobs) {
        if (job.assigned_to_user_id) {
          jobCounts[job.assigned_to_user_id] = (jobCounts[job.assigned_to_user_id] || 0) + 1;
        }
      }
    }

    const list: TechnicianInfo[] = (members || [])
      .filter((m: any) => m.user)
      .map((m: any) => {
        const u = Array.isArray(m.user) ? m.user[0] : m.user;
        return {
          id: m.id,
          userId: m.user_id,
          fullName: u.full_name || u.email,
          email: u.email,
          phone: u.phone || null,
          role: m.role,
          activeJobsCount: jobCounts[m.user_id] || 0,
          createdAt: m.created_at,
        };
      });

    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Removes a technician from the organization membership.
 */
export async function deleteTechnicianAction(memberId: string) {
  try {
    const { organization } = await AuthService.requireRole(['owner', 'admin']);
    const supabase = await createClient();

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organization.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/jobs');

    return { success: true, message: 'Technician removed from organization.' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
