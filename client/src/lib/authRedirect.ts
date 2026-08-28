export const PRODUCTION_APP_ORIGIN = "https://streamvideo-h2f3nxnx.manus.space";

export function getConfirmationRedirect(_origin: string): string {
  return `${PRODUCTION_APP_ORIGIN}/?confirmed=1`;
}

export function hasConfirmedEmail(search: string): boolean {
  return new URLSearchParams(search).get("confirmed") === "1";
}

export function getConfirmationMessage(search: string): string {
  return hasConfirmedEmail(search)
    ? "Email confirmed. Sign in to continue to your ELIZZY DOMAIN account."
    : "";
}

export default getConfirmationRedirect;
