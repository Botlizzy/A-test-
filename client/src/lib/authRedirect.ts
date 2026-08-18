export const PRODUCTION_APP_ORIGIN = "https://streamvideo-h2f3nxnx.manus.space";

function isNonPublicOrigin(origin: string): boolean {
  return /(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\.manus(?:pre)?\.computer|\.manus\.space)(?::\d+)?$/i.test(origin.replace(/\/$/, ""));
}

export function getConfirmationRedirect(origin: string): string {
  const normalized = origin.replace(/\/$/, "");
  const target = isNonPublicOrigin(normalized) ? PRODUCTION_APP_ORIGIN : normalized;
  return `${target}/?confirmed=1`;
}

export function hasConfirmedEmail(search: string): boolean {
  return new URLSearchParams(search).get("confirmed") === "1";
}

export function getConfirmationMessage(search: string): string {
  return hasConfirmedEmail(search) ? "Email confirmed. Sign in to continue to your ELIZZY DOMAIN account." : "";
}

export default getConfirmationRedirect;

