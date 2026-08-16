import { describe, expect, it } from "vitest";
import { getPasswordResetRedirect, hasRecoverySessionHash, validatePasswordReset } from "./passwordRecovery";

describe("password recovery", () => {
  it("requires a strong matching replacement password", () => {
    expect(validatePasswordReset("short", "short")).toContain("8 characters");
    expect(validatePasswordReset("long-enough", "different-password")).toContain("do not match");
    expect(validatePasswordReset("long-enough", "long-enough")).toBeNull();
  });

  it("adds reset mode to the production confirmation redirect", () => {
    expect(getPasswordResetRedirect("https://a-test-ten.vercel.app/?confirmed=1")).toBe("https://a-test-ten.vercel.app/?confirmed=1&mode=reset");
  });

  it("recognizes Supabase recovery hashes", () => {
    expect(hasRecoverySessionHash("#access_token=token&type=recovery")).toBe(true);
    expect(hasRecoverySessionHash("#access_token=token&type=signup")).toBe(false);
  });
});
