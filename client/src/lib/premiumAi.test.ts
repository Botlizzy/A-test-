import { describe, expect, it } from "vitest";
import { buildLyricsSearchUrl, extractLyricsText, extractLyricsTitle, extractPremiumAiError, extractPremiumAiText, getPremiumAiUrl, PREMIUM_AI_MODELS } from "./premiumAi";

describe("Premium AI chat helpers", () => {
  it("builds a prompt URL for a selected model", () => {
    expect(getPremiumAiUrl(PREMIUM_AI_MODELS[0], "hello there")).toBe("https://api.azbry.com/api/ai/aiko?q=hello+there");
  });

  it("uses the five Azbry Premium services", () => {
    expect(PREMIUM_AI_MODELS).toHaveLength(5);
    expect(PREMIUM_AI_MODELS.map((model) => model.id)).toEqual(["aiko", "ai4chat", "azbryai", "aicoder", "lyricsgen"]);
  });

  it("builds lyrics searches and extracts readable lyric text", () => {
    expect(buildLyricsSearchUrl("/lyrics/search", "Adele hello")).toBe("https://api.azbry.com/api/ai/lyricsgen?theme=Adele+hello&genre=pop&emotion=hopeful");
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
