import { describe, expect, it } from "vitest";
import { __test__ } from "./_core/context";

describe("Supabase tRPC auth bridge", () => {
  it("extracts a bearer token case-insensitively", () => {
    const request = { get: (name: string) => name === "authorization" ? "bearer supabase-token" : undefined } as never;
    expect(__test__.supabaseBearer(request)).toBe("supabase-token");
  });

  it("rejects missing or malformed authorization headers", () => {
    const missing = { get: () => undefined } as never;
    const malformed = { get: () => "Basic credentials" } as never;
    expect(__test__.supabaseBearer(missing)).toBeNull();
    expect(__test__.supabaseBearer(malformed)).toBeNull();
  });
});
