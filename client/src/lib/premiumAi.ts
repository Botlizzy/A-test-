export type PremiumAiModel = { id: string; name: string; provider: string; path: string; queryKey?: "q" | "prompt" };

export const PREMIUM_AI_MODELS: PremiumAiModel[] = [
  { id: "aiko", name: "Aiko", provider: "Azbry AI", path: "/api/ai/aiko", queryKey: "q" },
  { id: "ai4chat", name: "AI4Chat", provider: "Azbry AI", path: "/api/ai/ai4chat", queryKey: "q" },
  { id: "azbryai", name: "Azbry AI", provider: "Azbry AI", path: "/api/ai/azbryai", queryKey: "q" },
  { id: "aicoder", name: "AI Coder", provider: "Azbry Tools", path: "/api/tools/aicoder", queryKey: "prompt" },
  { id: "lyricsgen", name: "LyricsGen", provider: "Azbry AI", path: "/api/ai/lyricsgen", queryKey: "prompt" },
];

const AI_BASE = "https://api.azbry.com";

export function getPremiumAiUrl(model: PremiumAiModel, prompt: string): string {
  const url = new URL(`${AI_BASE}${model.path}`);
  if (model.id === "lyricsgen") {
    url.searchParams.set("theme", prompt.trim());
    url.searchParams.set("genre", "pop");
    url.searchParams.set("emotion", "hopeful");
  } else {
    url.searchParams.set(model.queryKey || "q", prompt.trim());
  }
  return url.toString();
}

export function extractPremiumAiText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  for (const key of ["data", "response", "answer", "message", "text", "output", "code", "result"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      const nested = extractPremiumAiText(value);
      if (nested) return nested;
    }
  }
  return "";
}

export function extractPremiumAiError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  for (const key of ["message", "error", "detail"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function buildLyricsSearchUrl(path: string, query: string): string {
  const url = new URL(`${AI_BASE}/api/ai/lyricsgen`);
  url.searchParams.set("theme", query.trim());
  url.searchParams.set("genre", "pop");
  url.searchParams.set("emotion", "hopeful");
  return url.toString();
}

export function extractLyricsText(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  for (const key of ["lyrics", "lyric", "text", "content", "data", "result"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      const nested = extractLyricsText(value);
      if (nested) return nested;
    }
  }
  return "";
}

export function extractLyricsTitle(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Lyrics result";
  const record = payload as Record<string, unknown>;
  const title = record.title || record.song || record.name;
  const artist = record.artist || record.author || record.singer;
  if (typeof title === "string" && typeof artist === "string") return `${title} — ${artist}`;
  if (typeof title === "string") return title;
  return "Lyrics result";
}
