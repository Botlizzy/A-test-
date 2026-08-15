const CUSTOMER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeCustomerId(value: string): string {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim().toLowerCase();
}

export function isCustomerId(value: string): boolean {
  return CUSTOMER_ID_PATTERN.test(normalizeCustomerId(value));
}
