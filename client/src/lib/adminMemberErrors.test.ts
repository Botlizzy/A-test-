import { describe, expect, it } from "vitest";
import { memberListErrorMessage, shouldRetryMemberListError } from "./adminMemberErrors";

describe("admin member-list errors", () => {
  it("retries schema-cache errors instead of telling admins to seed data", () => {
    expect(shouldRetryMemberListError({ code: "PGRST202", message: "Could not find the function in the schema cache" })).toBe(true);
    expect(memberListErrorMessage({ code: "PGRST202", message: "Could not find the function in the schema cache" })).toContain("Refresh members");
  });

  it("explains that the session must be an approved admin", () => {
    expect(memberListErrorMessage({ message: "Only approved administrators can list members" })).toContain("approved admin email");
  });

  it("keeps unknown errors visible instead of hiding the cause", () => {
    expect(memberListErrorMessage({ message: "Network request failed" })).toBe("Network request failed");
  });
});
