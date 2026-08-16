export const PREMIUM_DURATION_OPTIONS = [
  { value: "1", label: "1 day" },
  { value: "2", label: "2 days" },
  { value: "10", label: "10 days" },
  { value: "custom", label: "Custom duration" },
] as const;

export type PremiumDurationSelection = (typeof PREMIUM_DURATION_OPTIONS)[number]["value"];

export function getPremiumDurationDays(selection: PremiumDurationSelection, customDays: string): number | null {
  if (selection === "custom") {
    const parsed = Number(customDays);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 3650 ? parsed : null;
  }
  return Number(selection);
}

export function getPremiumExpiryIso(now: Date, days: number): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function isPremiumCurrentlyActive(active: boolean, expiresAt: string | null | undefined, now = new Date()): boolean {
  return active && (!expiresAt || new Date(expiresAt).getTime() > now.getTime());
}
