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
