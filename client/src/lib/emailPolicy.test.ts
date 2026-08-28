import { describe, expect, it } from "vitest";
import { validateSignupEmail } from "./emailPolicy";

describe("signup email policy", () => {
  it("accepts Gmail and Yahoo Mail addresses", () => {
    expect(validateSignupEmail("person@gmail.com")).toEqual({ valid: true });
    expect(validateSignupEmail("person@yahoo.com")).toEqual({ valid: true });
    expect(validateSignupEmail("person@ymail.com")).toEqual({ valid: true });
  });

  it("rejects malformed and unsupported domains", () => {
    expect(validateSignupEmail("personexample.com").valid).toBe(false);
    expect(validateSignupEmail("person@outlook.com").valid).toBe(false);
  });

  it("rejects known disposable domains", () => {
    expect(validateSignupEmail("person@mailinator.com")).toEqual({
      valid: false,
      message: "Temporary or disposable email addresses are not accepted.",
    });
  });
});
