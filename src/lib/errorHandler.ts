export function getFriendlyErrorMessage(err: any): string {
  if (err === null || err === undefined || err === '') {
    return 'An unexpected error occurred.';
  }

  const rawMsg = err?.message || (typeof err === 'string' ? err : err?.code) || (typeof err?.toString === 'function' && err.toString() !== '[object Object]' ? err.toString() : '');
  const msg = typeof rawMsg === 'string' ? rawMsg : String(rawMsg || '');
  
  if (!msg || msg === '[object Object]') {
    return 'An unexpected error occurred.';
  }

  // Supabase / PostgREST errors
  if (msg.includes('PGRST116') || String(err?.code || '').includes('PGRST116') || msg.toLowerCase().includes('pgrst116')) {
    return 'Record not found.';
  }
  
  // Auth errors
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Invalid email or password.';
  }
  
  // Network / Fetch errors
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.toLowerCase().includes('network')) {
    return 'Connection issue. Please try again.';
  }

  return msg;
}
