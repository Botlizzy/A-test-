import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve(process.cwd(), "supabase/schema.sql"), "utf8");
const rpc = schema.slice(schema.indexOf("create or replace function public.admin_delete_account"));

describe("admin account deletion migration", () => {
  it("clears premium state before deleting the auth account", () => {
    expect(rpc).toContain("delete from public.premium_entitlements where user_id = target_user_id;");
    expect(rpc).toContain("delete from auth.users where id = target_user_id;");
  });

  it("does not directly mutate storage.objects", () => {
    expect(rpc).not.toMatch(/delete\s+from\s+storage\.objects/i);
  });
});
