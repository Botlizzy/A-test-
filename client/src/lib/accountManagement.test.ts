import { describe, expect, it } from "vitest";
import { accountStatusDescription, accountStatusLabel, getNextAccountStatus } from "./accountManagement";

describe("account management helpers", () => {
  it("toggles between active and suspended safely", () => {
    expect(getNextAccountStatus("active")).toBe("suspended");
    expect(getNextAccountStatus("suspended")).toBe("active");
    expect(getNextAccountStatus(undefined)).toBe("suspended");
  });

  it("uses a safe active default for missing status", () => {
    expect(accountStatusLabel(undefined)).toBe("ACTIVE");
    expect(accountStatusDescription("suspended")).toContain("cannot enter");
    expect(accountStatusDescription("active")).toContain("normally");
  });
});
