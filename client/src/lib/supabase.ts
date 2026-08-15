/* Coastal Signal auth layer: keep credential handling inside Supabase Auth and expose only the session client. */
import { createClient } from "@supabase/supabase-js";

// These are browser-safe Supabase values. Vercel environment variables override them when configured.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://hvaytcqnimsvrrwwwqqz.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YXl0Y3FuaW1zdnJyd3d3cXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NzM5MzksImV4cCI6MjEwMjM0OTkzOX0.O5f0Tflj3aKMDkkIdqSGewibITNcyU-A02V1kGmrbF8";

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
