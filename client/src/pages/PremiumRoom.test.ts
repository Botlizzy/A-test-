import { describe, expect, it } from "vitest";
import { getBoostStatusUrl, isTerminalBoostStatus } from "./PremiumRoom";

describe("Premium booster status helpers", () => {
  it("accepts supported status URL fields", () => {
    expect(getBoostStatusUrl({ status_url: "https://apis.davidcyril.name.ng/status/123" })).toBe("https://apis.davidcyril.name.ng/status/123");
    expect(getBoostStatusUrl({ statusUrl: "https://example.com/status/123" })).toBe("https://example.com/status/123");
  });

  it("rejects missing or unsafe status URLs", () => {
    expect(getBoostStatusUrl({ status_url: "not-a-url" })).toBeNull();
    expect(getBoostStatusUrl({})).toBeNull();
  });

  it("distinguishes pending jobs from terminal provider results", () => {
    expect(isTerminalBoostStatus({ status: "pending" })).toBe(false);
    expect(isTerminalBoostStatus({ status: "completed" })).toBe(true);
    expect(isTerminalBoostStatus({ success: true })).toBe(true);
    expect(isTerminalBoostStatus({ success: false })).toBe(true);
  });
});
