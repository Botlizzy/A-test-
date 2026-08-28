const ALLOWED_DOMAIN_PATTERNS = [
  /^(?:gmail)\.[a-z.]+$/i,
  /^(?:yahoo|ymail)\.[a-z.]+$/i,
];

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  " guerrillamail.com".trim(),
  "mailinator.com",
  "temp-mail.org",
  "tempmail.com",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "emailondeck.com",
  "mohmal.com",
]);

export type EmailPolicyResult = { valid: true } | { valid: false; message: string };

export function validateSignupEmail(rawEmail: string): EmailPolicyResult {
  const email = rawEmail.trim().toLowerCase();
  const atIndex = email.lastIndexOf("@");
  const localPart = atIndex > 0 ? email.slice(0, atIndex) : "";
  const domain = atIndex > 0 ? email.slice(atIndex + 1) : "";
  if (!localPart || !domain || localPart.length > 64 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return { valid: false, message: "Enter a valid Gmail or Yahoo Mail address." };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, message: "Temporary or disposable email addresses are not accepted." };
  }
  if (!ALLOWED_DOMAIN_PATTERNS.some((pattern) => pattern.test(domain))) {
    return { valid: false, message: "Use a Gmail or Yahoo Mail address to create an account." };
  }
  return { valid: true };
}
