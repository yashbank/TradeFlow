'use server';

import { AuthService } from '@/services/AuthService';
import { RegisterSchema, LoginSchema } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

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

  try {
    await AuthService.registerUser(parsed.data);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to complete registration.',
    };
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

  try {
    await AuthService.loginUser(parsed.data);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Invalid email or password.',
    };
  }

  redirect('/dashboard');
}

export async function logoutUserAction() {
  try {
    await AuthService.logoutUser();
  } catch (err) {
    console.error('Logout error:', err);
  }
  redirect('/login');
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
    };
  }

  const reqHeaders = await headers();
  const host = reqHeaders.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectTo = `${protocol}://${host}/reset-password`;

  try {
    await AuthService.requestPasswordReset(email, redirectTo);
    return {
      success: true,
      message: 'Password reset link sent. Please check your inbox.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to send password reset email.',
    };
  }
}

export async function resetPasswordAction(formData: FormData) {
  const password = (formData.get('password') as string) || '';
  const confirmPassword = (formData.get('confirmPassword') as string) || '';

  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters.',
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match.',
    };
  }

  try {
    await AuthService.resetPassword(password);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to reset password.',
    };
  }

  redirect('/login?reset=success');
}
