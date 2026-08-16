export const MUREKA_BASE_URL = "https://apis.davidcyril.name.ng";
export const MUREKA_CREATE_PATH = "/aimusic/mureka/create";
export const MUREKA_STATUS_PATH = "/aimusic/mureka/status";

export type MurekaCreateOptions = {
  prompt: string;
  title?: string;
  style?: string;
  lyrics?: string;
  instrumental?: boolean;
};

export type MurekaPayload = Record<string, unknown>;
const TASK_KEYS = /^(task_?id|job_?id|request_?id|generation_?id|song_?id|id)$/i;
const AUDIO_KEYS = /audio|music|song|track|download|stream|mp3|m4a|wav|url/i;
const TERMINAL_STATUSES = new Set(["complete", "completed", "success", "succeeded", "failed", "error", "cancelled", "canceled", "ready"]);

export function buildMurekaCreatePayload(options: MurekaCreateOptions): MurekaPayload {
  const payload: MurekaPayload = { prompt: options.prompt.trim(), title: options.title?.trim() || undefined, style: options.style?.trim() || undefined, lyrics: options.lyrics?.trim() || undefined, instrumental: options.instrumental === true };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""));
}

export function extractMurekaTaskId(value: unknown): string | null {
  let found: string | null = null;
  const visit = (node: unknown, keyHint = "") => {
    if (found) return;
    if ((typeof node === "string" || typeof node === "number") && TASK_KEYS.test(keyHint) && String(node).trim()) found = String(node).trim();
    else if (Array.isArray(node)) node.forEach((item) => visit(item, keyHint));
    else if (node && typeof node === "object") Object.entries(node).forEach(([key, child]) => visit(child, key));
  };
  visit(value);
  return found;
}

export function isMurekaTerminal(value: unknown): boolean {
  let terminal = false;
  const visit = (node: unknown, keyHint = "") => {
    if (terminal) return;
    if (typeof node === "string" && /^(status|state)$/i.test(keyHint)) terminal = TERMINAL_STATUSES.has(node.toLowerCase());
    if (typeof node === "boolean" && /^(success|complete|completed|ready)$/i.test(keyHint)) terminal = true;
    if (Array.isArray(node)) node.forEach((item) => visit(item, keyHint));
    else if (node && typeof node === "object") Object.entries(node).forEach(([key, child]) => visit(child, key));
  };
  visit(value);
  return terminal;
}

function isAudioUrl(url: string, keyHint: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("davidcyril.name.ng") || host.includes("localhost") || host.includes("127.0.0.1")) return false;
    return /\.(mp3|m4a|wav|ogg|opus|aac|flac)(?:$|[?#])/i.test(url) || AUDIO_KEYS.test(keyHint) || /\/(audio|music|song|track|stream|download)(?:[/?]|$)/i.test(parsed.pathname) || parsed.searchParams.has("token");
  } catch { return false; }
}

export function extractMurekaAudioTracks(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown, keyHint = "") => {
    if (typeof node === "string") {
      (node.match(/https?:\/\/[^\s"'\\]+/g) || []).forEach((raw) => { const url = raw.replace(/[),.;]+$/, ""); if (isAudioUrl(url, keyHint)) found.push(url); });
    } else if (Array.isArray(node)) node.forEach((item) => visit(item, keyHint));
    else if (node && typeof node === "object") Object.entries(node).forEach(([key, child]) => visit(child, key));
  };
  visit(value);
  return Array.from(new Set(found)).slice(0, 8);
}

export function safeMurekaFilename(url: string, index = 1): string {
  try {
    const name = new URL(url).pathname.split("/").pop() || `eliminator-mureka-track-${index}.mp3`;
    const clean = name.replace(/[^a-z0-9._-]+/gi, "-").slice(-96);
    return /\.[a-z0-9]{2,5}$/i.test(clean) ? clean : `${clean}.mp3`;
  } catch { return `eliminator-mureka-track-${index}.mp3`; }
}
