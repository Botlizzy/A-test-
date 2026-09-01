import { describe, expect, it } from "vitest";
import { formatAuthError, formatSignupSuccess } from "./authErrors";

describe("authentication error guidance", () => {
  it("provides verification signup success guidance", () => {
    expect(formatSignupSuccess(true)).toContain("Signup successful");
    expect(formatSignupSuccess(false)).toContain("verification link");
    expect(formatSignupSuccess(false)).toContain("inbox");
  });

  it("explains existing-account recovery", () => {
    expect(formatAuthError("User already registered", "signup")).toContain("already exists");
    expect(formatAuthError("Invalid login credentials", "login")).toContain("incorrect");
  });

  it("uses verification-email guidance for provider limits", () => {
    const message = formatAuthError("over_email_send_rate_limit", "signup");
    expect(message).toContain("verification email");
    expect(message).toContain("use Sign in");
  });

  it("turns browser fetch failures into actionable mobile guidance", () => {
    expect(formatAuthError("Failed to fetch", "login")).toContain("mobile connection");
  });

  it("explains unverified email login errors", () => {
    expect(formatAuthError("Email not confirmed", "login")).toContain("not verified");
  });

  it("keeps unknown provider details readable", () => {
    expect(formatAuthError("Unexpected authentication response", "login")).toBe("Unexpected authentication response");
  });
});
