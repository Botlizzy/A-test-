export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? "https://hvaytcqnimsvrrwwwqqz.supabase.co",
  // Supabase anon keys are browser-safe and this fallback matches the client configuration.
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YXl0Y3FuaW1zdnJyd3d3cXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NzM5MzksImV4cCI6MjEwMjM0OTkzOX0.O5f0Tflj3aKMDkkIdqSGewibITNcyU-A02V1kGmrbF8",
};
