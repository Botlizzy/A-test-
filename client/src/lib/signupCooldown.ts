export const SIGNUP_COOLDOWN_STORAGE_KEY = "eliminator-signup-cooldown-until";
export const SIGNUP_COOLDOWN_MS = 5 * 60 * 1000;

export function readSignupCooldown(now = Date.now(), storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined" ? window.localStorage : null): number {
  try {
    const value = Number(storage?.getItem(SIGNUP_COOLDOWN_STORAGE_KEY) || 0);
    if (!Number.isFinite(value) || value <= now) return 0;
    return Math.ceil((value - now) / 1000);
  } catch {
    return 0;
  }
}

export function writeSignupCooldown(until: number, storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined" ? window.localStorage : null): void {
  try {
    storage?.setItem(SIGNUP_COOLDOWN_STORAGE_KEY, String(until));
  } catch {
    // Storage can be unavailable in private browsing; in-memory state still protects the current view.
  }
}

export function clearSignupCooldown(storage: Pick<Storage, "removeItem"> | null = typeof window !== "undefined" ? window.localStorage : null): void {
  try {
    storage?.removeItem(SIGNUP_COOLDOWN_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
