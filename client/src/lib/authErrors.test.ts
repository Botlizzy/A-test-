import { describe, expect, it } from "vitest";
import { formatAuthError, formatPasswordResetError, formatSignupSuccess } from "./authErrors";

describe("authentication error guidance", () => {
  it("provides explicit signup success guidance", () => {
    expect(formatSignupSuccess(true)).toContain("Signup successful");
    expect(formatSignupSuccess(false)).toContain("Check your inbox");
  });
  it("explains existing-account recovery", () => {
    expect(formatAuthError("User already registered", "signup")).toContain("already exists");
    expect(formatAuthError("Invalid login credentials", "login")).toContain("incorrect");
  });

  it("explains when Supabase is limiting confirmation-email delivery", () => {
    const message = formatAuthError("over_email_send_rate_limit", "signup");
    expect(message).toContain("Supabase could not send the confirmation email");
    expect(message).toContain("email-provider limit");
    expect(message).toContain("not an ELIZZY DOMAIN signup cooldown");
    expect(message).toContain("configure SMTP in Supabase");
  });

  it("turns browser fetch failures into actionable mobile guidance", () => {
    expect(formatAuthError("Failed to fetch", "login")).toContain("mobile connection");
  });

  it("keeps unknown provider details readable", () => {
    expect(formatAuthError("Unexpected authentication response", "login")).toBe("Unexpected authentication response");
  });

  it("turns missing reset sessions into a clear retry instruction", () => {
    expect(formatPasswordResetError("Auth session missing")).toContain("expired or was already used");
    expect(formatPasswordResetError("Invalid password")).toBe("Invalid password");
  });
});
