import { describe, expect, it } from "vitest";
import {
  ADMIN_DELETE_CLEANUP_STEPS,
  getAvatarStoragePath,
  isDeleteConfirmationValid,
  replacementAccountStartsWithoutPremium,
} from "./adminAccountDeletion";

describe("admin account deletion safeguards", () => {
  it("extracts only the target user's avatar path", () => {
    expect(getAvatarStoragePath("https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.png", "user-1")).toBe("user-1/avatar.png");
    expect(getAvatarStoragePath("https://project.supabase.co/storage/v1/object/public/avatars/user-2/avatar.png", "user-1")).toBeNull();
  });

  it("requires the administrator to type the target email", () => {
    expect(isDeleteConfirmationValid("  MEMBER@GMAIL.COM ", "member@gmail.com")).toBe(true);
    expect(isDeleteConfirmationValid("DELETE", "member@gmail.com")).toBe(false);
  });

  it("cleans dependent records before deleting the auth user", () => {
    expect(ADMIN_DELETE_CLEANUP_STEPS).toEqual([
      "remove_avatar_via_storage_api",
      "delete_verification_requests",
      "delete_premium_entitlements",
      "delete_profile",
      "delete_auth_user",
    ]);
    expect(ADMIN_DELETE_CLEANUP_STEPS.indexOf("delete_premium_entitlements")).toBeLessThan(ADMIN_DELETE_CLEANUP_STEPS.indexOf("delete_auth_user"));
  });

  it("treats a same-email replacement as a fresh non-premium account", () => {
    expect(replacementAccountStartsWithoutPremium("old-user-id", "new-user-id")).toBe(true);
    expect(replacementAccountStartsWithoutPremium("old-user-id", "old-user-id")).toBe(false);
  });
});
