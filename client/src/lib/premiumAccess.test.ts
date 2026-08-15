import { describe, expect, it } from "vitest";
import { hasPermanentPremiumAccess } from "./premiumAccess";

describe("hasPermanentPremiumAccess", () => {
  it("grants permanent access to the owner email case-insensitively", () => {
    expect(hasPermanentPremiumAccess("MIKEAKEX80@GMAIL.COM")).toBe(true);
  });

  it("does not grant permanent access to ordinary customers", () => {
    expect(hasPermanentPremiumAccess("customer@example.com")).toBe(false);
    expect(hasPermanentPremiumAccess(null)).toBe(false);
  });
});
