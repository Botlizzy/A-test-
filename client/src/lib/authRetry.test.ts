import { describe, expect, it, vi } from "vitest";
import { isTransientAuthError, withTransientAuthRetry } from "./authRetry";

describe("auth retry helper", () => {
  it("recognizes browser network failures", () => {
    expect(isTransientAuthError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isTransientAuthError(new Error("Invalid login credentials"))).toBe(false);
  });

  it("retries transient failures and returns the eventual response", async () => {
    vi.useFakeTimers();
    const request = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce("ok");
    const promise = withTransientAuthRetry(request, { delayMs: 1 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(request).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("does not retry ordinary authentication failures", async () => {
    const request = vi.fn().mockRejectedValue(new Error("Invalid login credentials"));
    await expect(withTransientAuthRetry(request, { delayMs: 0 })).rejects.toThrow("Invalid login credentials");
    expect(request).toHaveBeenCalledTimes(1);
  });
});
