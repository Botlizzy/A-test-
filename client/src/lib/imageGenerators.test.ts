import { describe, expect, it } from "vitest";
import { getImageGeneratorUrl, parseImageGeneratorResponse } from "./imageGenerators";

describe("image generator providers", () => {
  it("builds the documented Writecream URL with prompt and ratio", () => {
    expect(getImageGeneratorUrl("writecream", "sunset", "16:9")).toBe("https://apis.davidcyril.name.ng/ai/writecream/image?prompt=sunset&ratio=16%3A9");
  });

  it("builds the documented Animagine URL with prompt only", () => {
    expect(getImageGeneratorUrl("animagine", "anime hero")).toBe("https://apis.davidcyril.name.ng/animagine?prompt=anime+hero");
  });

  it("accepts JSON image URLs and rejects provider endpoint URLs", async () => {
    const result = await parseImageGeneratorResponse(new Response(JSON.stringify({ image: "https://cdn.example.com/generated.png" }), { status: 200, headers: { "content-type": "application/json" } }));
    expect(result.url).toBe("https://cdn.example.com/generated.png");
  });

  it("accepts direct image responses", async () => {
    const result = await parseImageGeneratorResponse(new Response(new Blob(["image"]), { status: 200, headers: { "content-type": "image/png" } }));
    expect(result.objectUrl).toBe(true);
  });

  it("returns readable errors for empty responses", async () => {
    await expect(parseImageGeneratorResponse(new Response("", { status: 200, headers: { "content-type": "application/json" } }))).rejects.toThrow("returned no image");
  });
});
