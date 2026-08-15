export function getConfirmationRedirect(origin: string): string {
  return `${origin.replace(/\/$/, "")}/?confirmed=1`;
}

export function hasConfirmedEmail(search: string): boolean {
  return new URLSearchParams(search).get("confirmed") === "1";
}

export function getConfirmationMessage(search: string): string {
  return hasConfirmedEmail(search) ? "Email confirmed. Sign in to continue to your Eliminator account." : "";
}

export default getConfirmationRedirect;

