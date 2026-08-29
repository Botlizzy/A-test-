export const ADMIN_DELETE_CLEANUP_STEPS = [
  "remove_avatar_via_storage_api",
  "delete_verification_requests",
  "delete_premium_entitlements",
  "delete_profile",
  "delete_auth_user",
] as const;

export function getAvatarStoragePath(avatarUrl: string | null | undefined, userId: string): string | null {
  if (!avatarUrl) return null;
  try {
    const url = new URL(avatarUrl, "https://storage.invalid");
    const marker = `/avatars/${userId}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    return decodeURIComponent(url.pathname.slice(markerIndex + "/avatars/".length));
  } catch {
    return null;
  }
}

export function isDeleteConfirmationValid(input: string, email: string): boolean {
  return input.trim().toLowerCase() === email.trim().toLowerCase();
}

/** Premium is keyed by the auth UUID, so a replacement signup receives no old entitlement. */
export function replacementAccountStartsWithoutPremium(oldUserId: string, newUserId: string): boolean {
  return oldUserId !== newUserId;
}
