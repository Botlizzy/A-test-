import { describe, expect, it } from "vitest";
import { extractPremiumAiText, getPremiumAiUrl, PREMIUM_AI_MODELS } from "./premiumAi";

describe("Premium AI chat helpers", () => {
  it("builds a prompt URL for a selected model", () => {
    expect(getPremiumAiUrl(PREMIUM_AI_MODELS[0], "hello there")).toBe("https://apis.davidcyril.name.ng/ai/gpt-4o?prompt=hello+there");
  });

  it("extracts a readable response instead of forcing JSON into chat", () => {
    expect(extractPremiumAiText({ success: true, data: "Hello from the model" })).toBe("Hello from the model");
    expect(extractPremiumAiText({ answer: "Another answer" })).toBe("Another answer");
    expect(extractPremiumAiText({ success: false })).toBe("");
  });
});
