import { describe, expect, it } from "vitest";
import { getPremiumDurationDays, getPremiumExpiryIso, isPremiumCurrentlyActive } from "./premiumDuration";

describe("premium duration", () => {
  it("supports the standard duration choices", () => {
    expect(getPremiumDurationDays("1", "")).toBe(1);
    expect(getPremiumDurationDays("2", "")).toBe(2);
    expect(getPremiumDurationDays("10", "")).toBe(10);
  });

  it("accepts custom durations only within the safe range", () => {
    expect(getPremiumDurationDays("custom", "30")).toBe(30);
    expect(getPremiumDurationDays("custom", "0")).toBeNull();
    expect(getPremiumDurationDays("custom", "3651")).toBeNull();
  });

  it("calculates expiry and treats expired access as inactive", () => {
    const now = new Date("2026-08-16T00:00:00.000Z");
    const expiry = getPremiumExpiryIso(now, 2);
    expect(expiry).toBe("2026-08-18T00:00:00.000Z");
    expect(isPremiumCurrentlyActive(true, expiry, now)).toBe(true);
    expect(isPremiumCurrentlyActive(true, "2026-08-15T23:59:59.000Z", now)).toBe(false);
  });
});
