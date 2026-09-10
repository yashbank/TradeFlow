// ==============================================================================
// src/services/AuthService.ts — Authentication & Workspace Provisioning
// ==============================================================================

import { createClient } from '@/lib/supabase/server';
import type { RegisterInput, LoginInput } from '@/lib/validations/auth';
import type { Organization, OrganizationMember, UserProfile, UserRole } from '@/types/database';

export interface UserOrgContext {
  user: UserProfile;
  organization: Organization;
  role: UserRole;
}

export class AuthService {
  /**
   * Registers a new user, provisions their organization, creates the owner membership,
   * and initializes a 14-day free trial subscription.
   */
  static async registerUser(input: RegisterInput) {
    const supabase = await createClient();

    // 1. Register with Supabase Auth
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

    // 2. Ensure public.users row exists
    await supabase.from('users').upsert({
      id: userId,
      full_name: input.fullName,
      email: input.email,
    });

    // 3. Generate unique slug from business name
    const baseSlug = input.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'org';
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // 4. Create Organization
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

    // 5. Create Owner Membership
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

    // 6. Initialize 14-Day Free Trial Subscription
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('subscriptions').insert({
      organization_id: org.id,
      plan_id: 'starter_monthly',
      status: 'trialing',
      trial_end: trialEnd,
    });

    return {
      userId,
      organizationId: org.id,
      organizationSlug: org.slug,
    };
  }

  /**
   * Authenticates user via email and password.
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
   * Resolves the current authenticated user, active organization, and role.
   */
  static async getCurrentContext(): Promise<UserOrgContext | null> {
    // Check for active demo session
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      if (cookieStore.get('tradeflow_demo_session')?.value === '1') {
        const { DEMO_USER, DEMO_ORGANIZATION } = await import('@/lib/demo/demo-store');
        return {
          user: DEMO_USER,
          organization: DEMO_ORGANIZATION,
          role: 'owner',
        };
      }
    } catch {
      // Not in request context
    }

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return null;

      // Fetch primary organization membership
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
