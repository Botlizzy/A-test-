const CLONE_API_URL = "https://api.azbry.com/api/tools/webclone";

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" || host.startsWith("10.") || host.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
}

export function validateCloneTarget(value: string): URL {
  let target: URL;
  try { target = new URL(value); } catch { throw new Error("Enter a complete public website URL, including https://."); }
  if (!/^https?:$/.test(target.protocol) || isBlockedHostname(target.hostname)) throw new Error("Only public http(s) websites can be cloned.");
  return target;
}

export type WebCloneResult = { url: string; filename: string };

export async function cloneAuthorizedWebsite(targetValue: string): Promise<WebCloneResult> {
  const target = validateCloneTarget(targetValue);
  const endpoint = new URL(CLONE_API_URL);
  endpoint.searchParams.set("url", target.toString());
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => ({})) as { status?: boolean; message?: string; result?: { url?: string; filename?: string } };
  if (!response.ok || payload.status !== true || !payload.result?.url) throw new Error(payload.message || `The clone service returned HTTP ${response.status}.`);
  const resultUrl = payload.result.url;
  if (!/^https:\/\//i.test(resultUrl) || !/\.zip(?:$|[?#])/i.test(resultUrl)) throw new Error("The clone service returned an invalid ZIP download.");
  return { url: resultUrl, filename: payload.result.filename || "website-clone.zip" };
}
