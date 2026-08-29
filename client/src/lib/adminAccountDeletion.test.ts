import { describe, expect, it } from "vitest";
import { getAvatarStoragePath, isDeleteConfirmationValid } from "./adminAccountDeletion";

describe("admin account deletion safeguards", () => {
  it("extracts only the target user's avatar path", () => {
    expect(getAvatarStoragePath("https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.png", "user-1")).toBe("user-1/avatar.png");
    expect(getAvatarStoragePath("https://project.supabase.co/storage/v1/object/public/avatars/user-2/avatar.png", "user-1")).toBeNull();
  });

  it("requires the administrator to type the target email", () => {
    expect(isDeleteConfirmationValid("  MEMBER@GMAIL.COM ", "member@gmail.com")).toBe(true);
    expect(isDeleteConfirmationValid("DELETE", "member@gmail.com")).toBe(false);
  });
});
