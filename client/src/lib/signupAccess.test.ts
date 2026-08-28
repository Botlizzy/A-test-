import { describe, expect, it } from "vitest";
import { signupAccessMessage } from "./signupAccess";

describe("immediate signup access", () => {
  it("confirms direct access when Supabase returns a session", () => {
    expect(signupAccessMessage(true, "person@example.com")).toContain("signed in");
  });

  it("does not mention email verification when no session is returned", () => {
    const message = signupAccessMessage(false, "person@example.com");
    expect(message).toContain("Sign in now");
    expect(message.toLowerCase()).not.toContain("verification");
  });
});
