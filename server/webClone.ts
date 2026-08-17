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
type ClonePayload = { status?: boolean; message?: string; error?: string; result?: { url?: string; filename?: string } };

export async function parseCloneResponse(response: Pick<Response, "ok" | "status" | "headers" | "text">): Promise<ClonePayload> {
  const raw = await response.text().catch(() => "");
  const body = raw.trim();
  if (!body) {
    throw new Error(response.ok ? "The clone service returned an empty response. Please try again." : `The clone service returned HTTP ${response.status} without an error message.`);
  }
  let payload: unknown;
  try { payload = JSON.parse(body); } catch {
    throw new Error(response.ok ? "The clone service returned an unreadable response. Please try again." : `The clone service returned HTTP ${response.status}.`);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("The clone service returned an invalid response. Please try again.");
  return payload as ClonePayload;
}

export async function cloneAuthorizedWebsite(targetValue: string): Promise<WebCloneResult> {
  const target = validateCloneTarget(targetValue);
  const endpoint = new URL(CLONE_API_URL);
  endpoint.searchParams.set("url", target.toString());
  let response: Response;
  try {
    response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("The clone service could not be reached. Please try again.");
  }
  let payload: ClonePayload;
  try {
    payload = await parseCloneResponse(response);
  } catch (cause) {
    if (cause instanceof Error) throw cause;
    throw new Error("The clone service returned an unreadable response. Please try again.");
  }
  if (!response.ok || payload.status !== true || !payload.result?.url) throw new Error(payload.message || payload.error || `The clone service returned HTTP ${response.status}.`);
  const resultUrl = payload.result.url;
  if (!/^https:\/\//i.test(resultUrl) || !/\.zip(?:$|[?#])/i.test(resultUrl)) throw new Error("The clone service returned an invalid ZIP download.");
  return { url: resultUrl, filename: payload.result.filename || "website-clone.zip" };
}
