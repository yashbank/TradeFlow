'use server';

import { AuthService } from '@/services/AuthService';
import { RegisterSchema, LoginSchema } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';

export async function registerUserAction(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
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
      error: err.message,
    };
  }

  redirect('/dashboard');
}

export async function loginUserAction(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

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
      error: err.message,
    };
  }

  redirect('/dashboard');
}

export async function logoutUserAction() {
  await AuthService.logoutUser();
  redirect('/login');
}
