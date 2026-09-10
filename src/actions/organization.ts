'use server';

import { AuthService } from '@/services/AuthService';
import { createClient } from '@/lib/supabase/server';
import { UpdateOrganizationSchema, type UpdateOrganizationInput } from '@/lib/validations/organization';
import { revalidatePath } from 'next/cache';

export async function updateOrganizationAction(input: UpdateOrganizationInput) {
  const parsed = UpdateOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const { organization } = await AuthService.requireRole(['owner', 'admin']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .update(parsed.data)
    .eq('id', organization.id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message || 'Failed to update organization settings.',
    };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return {
    success: true,
    data,
  };
}
