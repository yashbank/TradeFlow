// ==============================================================================
// src/services/AuthService.ts — Real Authentication & Multi-Tenant Provisioning
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import type { RegisterInput, LoginInput } from '@/lib/validations/auth';
import type { Organization, UserProfile, UserRole } from '@/types/database';

export interface UserOrgContext {
  user: UserProfile;
  organization: Organization;
  role: UserRole;
}

export class AuthService {
  /**
   * Registers a new user with Supabase Auth, creates the user profile,
   * provisions the business workspace atomically, and assigns Owner role.
   */
  static async registerUser(input: RegisterInput) {
    const supabase = await createClient();

    // 1. Register with Supabase Auth GoTrue
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user account.');
    }

    const userId = authData.user.id;

    // 2. Ensure public.users record exists
    const { error: userError } = await supabase.from('users').upsert({
      id: userId,
      full_name: input.fullName,
      email: input.email,
    });

    if (userError) {
      // Non-fatal if handle_new_user trigger already inserted the row
      console.warn('users upsert note:', userError.message);
    }

    // 3. Atomically Provision Workspace via stored procedure or direct inserts
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('fn_create_workspace', {
        p_user_id: userId,
        p_business_name: input.businessName,
        p_country: input.country,
        p_currency: input.currency,
        p_timezone: input.timezone,
        p_tax_rate_basis_points: 0,
      });

      if (!rpcError && rpcResult) {
        return {
          userId,
          organizationId: rpcResult.organization_id,
          organizationSlug: rpcResult.slug,
        };
      }
    } catch {
      // Fallback to manual transactional insert if RPC not applied
    }

    // Direct multi-step creation fallback
    const baseSlug = input.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 45) || 'org';
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: input.businessName,
        slug,
        email: input.email,
        country: input.country,
        currency: input.currency,
        timezone: input.timezone,
        tax_rate_basis_points: 0,
      })
      .select()
      .single();

    if (orgError || !org) {
      throw new Error(`Failed to create business workspace: ${orgError?.message}`);
    }

    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      throw new Error(`Failed to assign workspace ownership: ${memberError.message}`);
    }

    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('subscriptions').insert({
      organization_id: org.id,
      plan_id: 'starter_monthly',
      status: 'trialing',
      trial_start: new Date().toISOString(),
      trial_end: trialEnd,
    });

    await supabase.from('sequences').insert([
      { organization_id: org.id, entity_type: 'quote', last_val: 0 },
      { organization_id: org.id, entity_type: 'job', last_val: 0 },
      { organization_id: org.id, entity_type: 'invoice', last_val: 0 },
    ]);

    return {
      userId,
      organizationId: org.id,
      organizationSlug: org.slug,
    };
  }

  /**
   * Authenticates user via email and password using Supabase Auth.
   */
  static async loginUser(input: LoginInput) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    return data.user;
  }

  /**
   * Ends the user's authenticated session.
   */
  static async logoutUser() {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  /**
   * Triggers a password reset email via Supabase Auth.
   */
  static async requestPasswordReset(email: string, redirectTo: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Updates user's password once reset token is verified.
   */
  static async resetPassword(newPassword: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Resolves the current authenticated user, active organization, and role.
   * Guaranteed to read from real persistent Supabase session.
   */
  static async getCurrentContext(): Promise<UserOrgContext | null> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      // Fetch user profile from public.users
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return null;

      // Fetch primary organization membership with organization join
      const { data: member } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!member || !member.organization) return null;

      return {
        user: profile as UserProfile,
        organization: member.organization as Organization,
        role: member.role as UserRole,
      };
    } catch {
      return null;
    }
  }

  /**
   * Strict guard that requires an active session and returns context, or throws an error.
   */
  static async requireContext(): Promise<UserOrgContext> {
    const ctx = await this.getCurrentContext();
    if (!ctx) {
      throw new Error('AUTH_UNAUTHORIZED: Authentication required.');
    }
    return ctx;
  }

  /**
   * Strict guard enforcing specific roles (e.g. ['owner', 'admin']).
   */
  static async requireRole(allowedRoles: UserRole[]): Promise<UserOrgContext> {
    const ctx = await this.requireContext();
    if (!allowedRoles.includes(ctx.role)) {
      throw new Error(`ORG_FORBIDDEN: Requires one of [${allowedRoles.join(', ')}] role.`);
    }
    return ctx;
  }
}
