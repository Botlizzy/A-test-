import { describe, expect, it } from "vitest";
import {
  isValidSignupCode,
  sanitizeSignupCode,
  signupVerificationMessage,
  signupVerificationResentMessage,
  signupVerificationSuccessMessage,
} from "./signupVerification";

describe("signup verification code", () => {
  it("keeps only digits and caps input at six characters", () => {
    expect(sanitizeSignupCode("1a2-345678")).toBe("123456");
  });

  it("accepts exactly six digits", () => {
    expect(isValidSignupCode("123456")).toBe(true);
    expect(isValidSignupCode("12345")).toBe(false);
    expect(isValidSignupCode("1234567")).toBe(false);
    expect(isValidSignupCode("12a456")).toBe(false);
  });

  it("keeps the code email copy clear and branded", () => {
    expect(signupVerificationMessage("viewer@example.com")).toContain("viewer@example.com");
    expect(signupVerificationResentMessage()).toContain("six-digit verification code");
    expect(signupVerificationSuccessMessage()).toContain("ELIZZY DOMAIN");
  });
});
