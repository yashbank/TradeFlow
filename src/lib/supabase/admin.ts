import { createClient } from '@supabase/supabase-js';

// RESTRICTED: Used exclusively for Stripe webhook handling where no user session exists.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdgwaigakqrfrbriqlra.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZ3dhaWdha3FyZnJicmlxbHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA1MTQ4MSwiZXhwIjoyMTA0NjI3NDgxfQ.iDEypTdwMUxct1oBwGEubCG-Mm7e9msJ9CxSXJBSmzo';

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
