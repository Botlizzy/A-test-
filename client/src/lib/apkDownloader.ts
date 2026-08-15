export const APK_ENDPOINT = "https://apis.davidcyril.name.ng/download/apk";

export type OfficialStoreLinks = {
  googlePlay: string;
  palmstore: string;
};

export type ApkResult = {
  status?: boolean;
  owner?: string;
  query?: string;
  stores?: OfficialStoreLinks;
  apk?: {
    name?: string;
    lastUpdated?: string;
    package?: string;
    icon?: string;
    rating?: number | string;
    description?: string;
    summary?: string;
    developer?: string;
    downloadLink?: string;
  };
};

export function isApkSearch(value: string): boolean {
  return value.trim().length >= 2 && value.trim().length <= 80;
}

export function getApkDownloaderUrl(appName: string): string {
  const url = new URL(APK_ENDPOINT);
  url.searchParams.set("text", appName.trim());
  return url.toString();
}

export function getOfficialStoreLinks(appName: string): OfficialStoreLinks {
  const query = encodeURIComponent(appName.trim());
  return {
    googlePlay: `https://play.google.com/store/search?q=${query}&c=apps`,
    palmstore: `https://palmstore.com/search?keyword=${query}`,
  };
}

export function isAuthorizedPackageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "play.google.com" || host.endsWith(".google.com") || host === "palmstore.com" || host.endsWith(".palmstore.com");
  } catch {
    return false;
  }
}
