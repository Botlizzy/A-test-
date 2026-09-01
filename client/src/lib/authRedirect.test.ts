import { describe, expect, it } from "vitest";
import { getPasswordResetRedirect, getSignupEmailRedirect, isPublicAuthOrigin, resolveAuthRedirectOrigin } from "./authRedirect";

describe("auth redirect helpers", () => {
  it("accepts public https origins", () => {
    expect(isPublicAuthOrigin("https://zealous-elizzy.zone.id")).toBe(true);
  });

  it("rejects localhost-style origins", () => {
    expect(isPublicAuthOrigin("http://localhost:5173")).toBe(false);
    expect(isPublicAuthOrigin("https://127.0.0.1:3000")).toBe(false);
  });

  it("falls back to the live production origin when local origins are passed", () => {
    expect(resolveAuthRedirectOrigin("http://localhost:5173")).toBe("https://zealous-elizzy.zone.id");
    expect(getSignupEmailRedirect("http://localhost:5173")).toBe("https://zealous-elizzy.zone.id/?confirmed=1");
    expect(getPasswordResetRedirect("http://localhost:5173")).toBe("https://zealous-elizzy.zone.id/?reset=1");
  });

  it("keeps public deployed origins when available", () => {
    expect(getSignupEmailRedirect("https://zealous-elizzy.zone.id")).toBe("https://zealous-elizzy.zone.id/?confirmed=1");
  });
});
