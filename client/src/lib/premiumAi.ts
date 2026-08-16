export type PremiumAiModel = { id: string; name: string; provider: string; path: string };

export const PREMIUM_AI_MODELS: PremiumAiModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", path: "/ai/gpt-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", path: "/ai/gpt-4o-mini" },
  { id: "gpt-5", name: "GPT-5", provider: "OpenAI", path: "/ai/gpt-5" },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic", path: "/ai/claude-haiku-4.5" },
  { id: "claude-opus-4.8", name: "Claude Opus 4.8", provider: "Anthropic", path: "/ai/claude-opus-4.8" },
  { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", provider: "Anthropic", path: "/ai/claude-sonnet-4.6" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "Google", path: "/ai/gemini-3-pro" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "Google", path: "/ai/gemini-3.1-pro" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "DeepSeek", path: "/ai/deepseek-v4-flash" },
  { id: "grok-4.1-fast", name: "Grok 4.1 Fast", provider: "xAI", path: "/ai/grok-4.1-fast" },
  { id: "kimi-k2.6", name: "Kimi K2.6", provider: "Moonshot", path: "/ai/kimi-k2.6" },
  { id: "qwen3-max", name: "Qwen 3 Max", provider: "Qwen", path: "/ai/qwen3-max" },
  { id: "blackbox", name: "Blackbox AI", provider: "Blackbox", path: "/blackbox" },
  { id: "claude-fable-5", name: "Claude Fable 5", provider: "Anthropic", path: "/ai/claude-fable-5" },
  { id: "claude-opus-4.5", name: "Claude Opus 4.5", provider: "Anthropic", path: "/ai/claude-opus-4.5" },
  { id: "claude-opus-4.6", name: "Claude Opus 4.6", provider: "Anthropic", path: "/ai/claude-opus-4.6" },
  { id: "deepseek-v3.2-thinking", name: "DeepSeek V3.2 Thinking", provider: "DeepSeek", path: "/ai/deepseek-v3.2-thinking" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", provider: "DeepSeek", path: "/ai/deepseek-v4-pro" },
  { id: "gpt-5.1-instant", name: "GPT-5.1 Instant", provider: "OpenAI", path: "/ai/gpt-5.1-instant" },
  { id: "gpt-5.3-chat", name: "GPT-5.3 Chat", provider: "OpenAI", path: "/ai/gpt-5.3-chat" },
  { id: "gpt-5.4", name: "GPT-5.4", provider: "OpenAI", path: "/ai/gpt-5.4" },
  { id: "gpt-5.5", name: "GPT-5.5", provider: "OpenAI", path: "/ai/gpt-5.5" },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", path: "/ai/llama-4-maverick" },
  { id: "standard", name: "Standard AI", provider: "AI Hub", path: "/standard" },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", provider: "DeepSeek", path: "/deepseek-v3.2" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", path: "/gemini-2.5-flash-lite" },
  { id: "gemma-4", name: "Gemma 4", provider: "Google", path: "/gemma-4" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "OpenAI", path: "/gpt-4.1-nano" },
  { id: "gpt-oss-120b", name: "GPT OSS 120B", provider: "OpenAI", path: "/gpt-oss-120b" },
  { id: "gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI", path: "/gpt-5-nano" },
  { id: "llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", provider: "Meta", path: "/llama-3.3-70b-instruct" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: "Meta", path: "/llama-3.1-8b-instant" },
  { id: "llama-4-scout", name: "Llama 4 Scout", provider: "Meta", path: "/llama-4-scout" },
];

const AI_BASE = "https://apis.davidcyril.name.ng";

export function getPremiumAiUrl(model: PremiumAiModel, prompt: string): string {
  const url = new URL(`${AI_BASE}${model.path}`);
  url.searchParams.set("prompt", prompt.trim());
  return url.toString();
}

export function extractPremiumAiText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  for (const key of ["data", "response", "answer", "message", "text", "result"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
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
  const url = new URL(`${AI_BASE}${path}`);
  url.searchParams.set("q", query.trim());
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
