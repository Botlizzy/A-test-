import { describe, expect, it } from "vitest";
import { buildLyricsGenerationUrl, extractLyricsText, extractLyricsTitle, extractPremiumAiError, extractPremiumAiText, getPremiumAiUrl, LYRICS_GENERATOR_URL, PREMIUM_AI_MODELS } from "./premiumAi";

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
    expect(buildLyricsGenerationUrl("Adele hello")).toBe(`${LYRICS_GENERATOR_URL}?theme=Adele+hello&genre=pop&emotion=hopeful&lang=en`);
    expect(extractLyricsTitle({ title: "Hello", artist: "Adele" })).toBe("Hello — Adele");
    expect(extractLyricsText({ data: { lyrics: "Hello, it’s me" } })).toBe("Hello, it’s me");
    expect(extractPremiumAiError({ result: { error: "Not found" } })).toBe("Not found");
  });

  it("extracts a readable response from nested, array, and JSON-string envelopes", () => {
    expect(extractPremiumAiText({ success: true, data: "Hello from the model" })).toBe("Hello from the model");
    expect(extractPremiumAiText({ answer: "Another answer" })).toBe("Another answer");
    expect(extractPremiumAiText({ choices: [{ message: { content: "Nested answer" } }] })).toBe("Nested answer");
    expect(extractPremiumAiText('[{"response":"Array answer"}]')).toBe("Array answer");
    expect(extractPremiumAiText({ success: false })).toBe("");
  });

  it("extracts nested provider errors without displaying raw JSON", () => {
    expect(extractPremiumAiError({ result: { error: "Not found" } })).toBe("Not found");
    expect(extractPremiumAiError({ errors: [{ detail: "Rate limited" }] })).toBe("Rate limited");
  });
});
