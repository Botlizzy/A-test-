import { describe, expect, it } from "vitest";
import { clearSignupCooldown, readSignupCooldown, SIGNUP_COOLDOWN_STORAGE_KEY, writeSignupCooldown } from "./signupCooldown";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("signup cooldown", () => {
  it("persists and reads remaining seconds", () => {
    const store = storage();
    writeSignupCooldown(130_000, store);
    expect(store.getItem(SIGNUP_COOLDOWN_STORAGE_KEY)).toBe("130000");
    expect(readSignupCooldown(100_000, store)).toBe(30);
  });

  it("returns zero for expired or invalid values", () => {
    const store = storage();
    writeSignupCooldown(99_000, store);
    expect(readSignupCooldown(100_000, store)).toBe(0);
    store.setItem(SIGNUP_COOLDOWN_STORAGE_KEY, "not-a-number");
    expect(readSignupCooldown(100_000, store)).toBe(0);
  });

  it("clears a saved cooldown", () => {
    const store = storage();
    writeSignupCooldown(130_000, store);
    clearSignupCooldown(store);
    expect(store.getItem(SIGNUP_COOLDOWN_STORAGE_KEY)).toBeNull();
  });
});
