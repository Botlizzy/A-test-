export type PremiumAiModel = { id: string; name: string; provider: string; path: string };

export const PREMIUM_AI_MODELS: PremiumAiModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", path: "/ai/gpt-4o" },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic", path: "/ai/claude-haiku-4.5" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "Google", path: "/ai/gemini-3-pro" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "DeepSeek", path: "/ai/deepseek-v4-flash" },
  { id: "grok-4.1-fast", name: "Grok 4.1 Fast", provider: "xAI", path: "/ai/grok-4.1-fast" },
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
