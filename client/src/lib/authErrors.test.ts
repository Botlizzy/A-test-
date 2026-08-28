import { describe, expect, it } from "vitest";
import { formatAuthError, formatSignupSuccess } from "./authErrors";

describe("authentication error guidance", () => {
  it("provides immediate signup success guidance", () => {
    expect(formatSignupSuccess(true)).toContain("Signup successful");
    expect(formatSignupSuccess(false)).toContain("Use Sign in");
    expect(formatSignupSuccess(false).toLowerCase()).not.toContain("inbox");
  });

  it("explains existing-account recovery", () => {
    expect(formatAuthError("User already registered", "signup")).toContain("already exists");
    expect(formatAuthError("Invalid login credentials", "login")).toContain("incorrect");
  });

  it("uses neutral guidance for provider limits", () => {
    const message = formatAuthError("over_email_send_rate_limit", "signup");
    expect(message).toContain("We could not complete signup right now");
    expect(message).toContain("use Sign in");
    expect(message).not.toContain("confirmation");
  });

  it("turns browser fetch failures into actionable mobile guidance", () => {
    expect(formatAuthError("Failed to fetch", "login")).toContain("mobile connection");
  });

  it("keeps unknown provider details readable", () => {
    expect(formatAuthError("Unexpected authentication response", "login")).toBe("Unexpected authentication response");
  });
});
