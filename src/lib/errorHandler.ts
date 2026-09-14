export function getFriendlyErrorMessage(err: any): string {
  const msg = err?.message || err?.toString() || '';
  if (typeof msg !== 'string') return 'An unexpected error occurred.';

  // Supabase / PostgREST errors
  if (msg.includes('PGRST116')) return 'Record not found.';
  
  // Auth errors
  if (msg.includes('auth/invalid-email')) return 'Please enter a valid email address.';
  if (msg.includes('Invalid login credentials')) return 'Invalid email or password.';
  
  // Network / Fetch errors
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'Connection issue. Please try again.';
  }

  return msg;
}
