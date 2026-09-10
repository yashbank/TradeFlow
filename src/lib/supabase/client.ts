import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tdgwaigakqrfrbriqlra.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZ3dhaWdha3FyZnJicmlxbHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTE0ODEsImV4cCI6MjEwNDYyNzQ4MX0.-e9MlNPwO_7-eic18-9Ylqxvo-GS8Xon_SA6BlA6SSI';

  return createBrowserClient(url, key);
}
