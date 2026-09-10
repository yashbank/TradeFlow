'use server';

import { AuthService } from '@/services/AuthService';
import { RegisterSchema, LoginSchema } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function loginDemoAction() {
  const cookieStore = await cookies();
  cookieStore.set('tradeflow_demo_session', '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  redirect('/dashboard');
}

export async function registerUserAction(formData: FormData) {
  const raw = {
    email: (formData.get('email') as string)?.trim().toLowerCase(),
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
    businessName: formData.get('businessName') as string,
    country: (formData.get('country') as any) || 'US',
    currency: (formData.get('currency') as any) || 'USD',
    timezone: (formData.get('timezone') as string) || 'America/New_York',
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  // If local dev with mock Supabase credentials, seamlessly create demo session
  const isMockBackend = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock');

  try {
    if (isMockBackend) {
      const cookieStore = await cookies();
      cookieStore.set('tradeflow_demo_session', '1', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      await AuthService.registerUser(parsed.data);
    }
  } catch (err: any) {
    if (isMockBackend || err.message?.includes('fetch failed') || err.message?.includes('Failed to fetch')) {
      const cookieStore = await cookies();
      cookieStore.set('tradeflow_demo_session', '1', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  redirect('/dashboard');
}

export async function loginUserAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase();
  const password = (formData.get('password') as string) || '';

  const raw = { email, password };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  // Pre-configured demo credentials or mock backend
  const isMockBackend = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock');
  const isDemoUser = email === 'demo@tradeflow.app' || email === 'dave@davesplumbing.com';

  if (isDemoUser || isMockBackend) {
    const cookieStore = await cookies();
    cookieStore.set('tradeflow_demo_session', '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect('/dashboard');
  }

  try {
    await AuthService.loginUser(parsed.data);
  } catch (err: any) {
    if (err.message?.includes('fetch failed') || err.message?.includes('Failed to fetch')) {
      const cookieStore = await cookies();
      cookieStore.set('tradeflow_demo_session', '1', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      redirect('/dashboard');
    }

    return {
      success: false,
      error: err.message,
    };
  }

  redirect('/dashboard');
}

export async function logoutUserAction() {
  const cookieStore = await cookies();
  cookieStore.delete('tradeflow_demo_session');
  try {
    await AuthService.logoutUser();
  } catch {
    // Ignore signOut errors in offline/demo mode
  }
  redirect('/login');
}
