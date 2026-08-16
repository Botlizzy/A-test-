import { describe, expect, it } from "vitest";
import { accountStatusDescription, accountStatusLabel, getNextAccountStatus, getNextWarningState, isAccountSuspended } from "./accountManagement";

describe("account management helpers", () => {
  it("toggles between active and suspended safely", () => {
    expect(getNextAccountStatus("active")).toBe("suspended");
    expect(getNextAccountStatus("suspended")).toBe("active");
    expect(getNextAccountStatus(undefined)).toBe("suspended");
  });

  it("toggles warning state without changing suspension state", () => {
    expect(getNextWarningState(false)).toBe(true);
    expect(getNextWarningState(true)).toBe(false);
    expect(getNextWarningState(undefined)).toBe(true);
  });

  it("detects a suspended session for the auth boundary", () => {
    expect(isAccountSuspended("suspended")).toBe(true);
    expect(isAccountSuspended("active")).toBe(false);
    expect(isAccountSuspended(undefined)).toBe(false);
  });

  it("uses a safe active default for missing status", () => {
    expect(accountStatusLabel(undefined)).toBe("ACTIVE");
    expect(accountStatusDescription("suspended")).toContain("cannot enter");
    expect(accountStatusDescription("active")).toContain("normally");
  });
});
