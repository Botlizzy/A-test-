import { describe, expect, it } from "vitest";
import { signupAccessMessage } from "./signupAccess";

describe("immediate signup access", () => {
  it("confirms direct access when Supabase returns a session", () => {
    expect(signupAccessMessage(true, "person@example.com")).toContain("signed in");
  });

  it("explains verification when no session is returned", () => {
    const message = signupAccessMessage(false, "person@example.com");
    expect(message).toContain("verification link");
    expect(message).toContain("inbox");
  });
});
