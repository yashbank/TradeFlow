import { createClient } from '@supabase/supabase-js';

/**
 * Creates a server-only Supabase client with the Service Role Key.
 * Bypasses RLS strictly for secure token-validated public lookups (quotes/invoices)
 * and webhook processing.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = rawUrl && rawUrl.includes('supabase.co')
    ? rawUrl
    : 'https://tdgwaigakqrfrbriqlra.supabase.co';

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZ3dhaWdha3FyZnJicmlxbHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA1MTQ4MSwiZXhwIjoyMTA0NjI3NDgxfQ.iDEypTdwMUxct1oBwGEubCG-Mm7e9msJ9CxSXJBSmzo';

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
