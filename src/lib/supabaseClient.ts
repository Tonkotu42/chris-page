import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !publicKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured.');
  }

  client = createClient(url, publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
