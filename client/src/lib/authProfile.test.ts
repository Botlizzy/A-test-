import { describe, expect, it } from "vitest";
import { shouldCreateProfileAfterSignup } from "./authProfile";

describe("signup profile persistence", () => {
  it("does not write a profile before email verification creates a session", () => {
    expect(shouldCreateProfileAfterSignup(false)).toBe(false);
  });

  it("allows profile persistence after verification creates a session", () => {
    expect(shouldCreateProfileAfterSignup(true)).toBe(true);
  });
});
