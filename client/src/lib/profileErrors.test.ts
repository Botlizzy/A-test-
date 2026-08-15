import { describe, expect, it } from "vitest";
import { profileErrorMessage } from "./profileErrors";

describe("profileErrorMessage", () => {
  it("explains how to repair a missing profiles table", () => {
    expect(profileErrorMessage("relation public.profiles does not exist", "load")).toContain("supabase/schema.sql");
  });

  it("distinguishes RLS failures from missing schema", () => {
    expect(profileErrorMessage("new row violates row-level security policy", "save")).toContain("RLS policies");
  });

  it("gives a transient configuration message for other failures", () => {
    expect(profileErrorMessage("Failed to fetch", "load")).toContain("connection and Supabase configuration");
  });
});
