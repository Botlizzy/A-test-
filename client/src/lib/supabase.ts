/* Coastal Signal auth layer: keep credential handling inside Supabase Auth and expose only the session client. */
import { createClient } from "@supabase/supabase-js";

// Buyer-provided environment variables are required. Placeholders keep the client constructible without shipping credentials.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://your-project.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "replace-with-your-supabase-anon-key";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabaseConfigMessage =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel Project Settings → Environment Variables, then redeploy.";
