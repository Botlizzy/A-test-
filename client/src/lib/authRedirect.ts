const PRODUCTION_AUTH_ORIGIN = "https://zealous-elizzy.zone.id";

function normalizeOrigin(origin: string) {
  try {
    return new URL(origin).origin;
  } catch {
    return PRODUCTION_AUTH_ORIGIN;
  }
}

export function isPublicAuthOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:"
      && hostname !== "localhost"
      && hostname !== "127.0.0.1"
      && hostname !== "::1"
      && hostname !== "[::1]"
      && !hostname.endsWith(".local");
  } catch {
    return false;
  }
}

export function resolveAuthRedirectOrigin(origin?: string) {
  if (origin && isPublicAuthOrigin(origin)) return normalizeOrigin(origin);
  if (typeof window !== "undefined" && isPublicAuthOrigin(window.location.origin)) {
    return normalizeOrigin(window.location.origin);
  }
  return PRODUCTION_AUTH_ORIGIN;
}

export function getSignupEmailRedirect(origin?: string) {
  return `${resolveAuthRedirectOrigin(origin)}/?confirmed=1`;
}

export function getPasswordResetRedirect(origin?: string) {
  return `${resolveAuthRedirectOrigin(origin)}/?reset=1`;
}
