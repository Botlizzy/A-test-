import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { createClient } from "@supabase/supabase-js";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function supabaseBearer(req: CreateExpressContextOptions["req"]): string | null {
  const value = req.get("authorization");
  return value?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

async function authenticateSupabase(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  const token = supabaseBearer(req);
  if (!token || !ENV.supabaseAnonKey) return null;
  const client = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const now = new Date();
  return {
    id: 0,
    openId: data.user.id,
    name: (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email ?? null,
    email: data.user.email ?? null,
    loginMethod: "supabase",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  if (!user) {
    try {
      user = await authenticateSupabase(opts.req);
    } catch {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}

export const __test__ = { supabaseBearer };
