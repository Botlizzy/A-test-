const APK_ENDPOINT = "https://apis.davidcyril.name.ng/download/apk";

export type ApkResult = {
  status?: boolean;
  owner?: string;
  apk?: {
    name?: string;
    lastUpdated?: string;
    package?: string;
    icon?: string;
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
