const PERMANENT_PREMIUM_EMAILS = new Set(["mikeakex80@gmail.com"]);

export function hasPermanentPremiumAccess(email?: string | null) {
  return Boolean(email && PERMANENT_PREMIUM_EMAILS.has(email.trim().toLowerCase()));
}
