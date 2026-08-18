import { describe, expect, it } from "vitest";
import { isApprovedAdminEmail } from "./adminAccess";

describe("admin access guard", () => {
  it("accepts approved admin emails regardless of case or whitespace", () => {
    expect(isApprovedAdminEmail(" MIKEAKEX80@GMAIL.COM ")).toBe(true);
    expect(isApprovedAdminEmail("elijahchinecheremonah@gmail.com")).toBe(true);
  });

  it("does not treat members or empty identities as administrators", () => {
    expect(isApprovedAdminEmail("member@example.com")).toBe(false);
    expect(isApprovedAdminEmail(null)).toBe(false);
    expect(isApprovedAdminEmail(undefined)).toBe(false);
  });
});
