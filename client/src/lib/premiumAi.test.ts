import { describe, expect, it } from "vitest";
import { buildLyricsSearchUrl, extractLyricsText, extractLyricsTitle, extractPremiumAiError, extractPremiumAiText, getPremiumAiUrl, PREMIUM_AI_MODELS } from "./premiumAi";

describe("Premium AI chat helpers", () => {
  it("builds a prompt URL for a selected model", () => {
    expect(getPremiumAiUrl(PREMIUM_AI_MODELS[0], "hello there")).toBe("https://apis.davidcyril.name.ng/ai/gpt-4o?prompt=hello+there");
  });

  it("keeps the expanded AI gallery populated", () => {
    expect(PREMIUM_AI_MODELS.length).toBeGreaterThan(10);
    expect(PREMIUM_AI_MODELS.some((model) => model.name === "Claude Opus 4.8")).toBe(true);
    expect(PREMIUM_AI_MODELS.some((model) => model.name === "Qwen 3 Max")).toBe(true);
  });

  it("builds lyrics searches and extracts readable lyric text", () => {
    expect(buildLyricsSearchUrl("/lyrics/search", "Adele hello")).toBe("https://apis.davidcyril.name.ng/lyrics/search?q=Adele+hello");
    expect(extractLyricsTitle({ title: "Hello", artist: "Adele" })).toBe("Hello — Adele");
    expect(extractLyricsText({ data: { lyrics: "Hello, it’s me" } })).toBe("Hello, it’s me");
    expect(extractPremiumAiError({ result: { error: "Not found" } })).toBe("");
  });

  it("extracts a readable response instead of forcing JSON into chat", () => {
    expect(extractPremiumAiText({ success: true, data: "Hello from the model" })).toBe("Hello from the model");
    expect(extractPremiumAiText({ answer: "Another answer" })).toBe("Another answer");
    expect(extractPremiumAiText({ success: false })).toBe("");
  });
});
