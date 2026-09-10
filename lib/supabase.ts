import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export type ProjectRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  title: string;
  html: string;
  files: unknown;
  created_at: string;
  updated_at: string;
};
