import { describe, expect, it } from "vitest";
import { formatAuthError, formatSignupSuccess } from "./authErrors";

describe("authentication error guidance", () => {
  it("provides explicit signup success guidance", () => {
    expect(formatSignupSuccess(true)).toContain("Signup successful");
    expect(formatSignupSuccess(false)).toContain("Check your inbox");
  });
  it("explains existing-account recovery", () => {
    expect(formatAuthError("User already registered", "signup")).toContain("already exists");
    expect(formatAuthError("Invalid login credentials", "login")).toContain("incorrect");
  });

  it("reports provider delivery limits without imposing a client cooldown", () => {
    const message = formatAuthError("over_email_send_rate_limit", "signup");
    expect(message).toContain("does not impose a cooldown");
    expect(message).not.toContain("wait 300");
  });

  it("turns browser fetch failures into actionable mobile guidance", () => {
    expect(formatAuthError("Failed to fetch", "login")).toContain("mobile connection");
  });

  it("keeps unknown provider details readable", () => {
    expect(formatAuthError("Unexpected authentication response", "login")).toBe("Unexpected authentication response");
  });
});
