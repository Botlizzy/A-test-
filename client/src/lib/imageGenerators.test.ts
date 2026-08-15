import { describe, expect, it } from "vitest";
import { getImageGeneratorUrl, parseImageGeneratorResponse } from "./imageGenerators";

describe("image generator providers", () => {
  it("builds the documented Writecream URL with prompt and ratio", () => {
    expect(getImageGeneratorUrl("writecream", "sunset", "16:9")).toBe("https://apis.davidcyril.name.ng/ai/writecream/image?prompt=sunset&ratio=16%3A9");
  });

  it("builds the documented Animagine URL with prompt only", () => {
    expect(getImageGeneratorUrl("animagine", "anime hero")).toBe("https://apis.davidcyril.name.ng/animagine?prompt=anime+hero");
  });

  it("accepts Writecream's documented image_url success field", async () => {
    const result = await parseImageGeneratorResponse(new Response(JSON.stringify({ creator: "David Cyril", success: true, prompt: "sunset", ratio: "1:1", image_url: "https://dbuzz-assets.s3.amazonaws.com/ai_image/public/pl/image-test.jpeg" }), { status: 200, headers: { "content-type": "application/json" } }));
    expect(result.url).toContain("dbuzz-assets.s3.amazonaws.com");
  });

  it("accepts JSON image URLs and rejects provider endpoint URLs", async () => {
    const result = await parseImageGeneratorResponse(new Response(JSON.stringify({ image: "https://cdn.example.com/generated.png" }), { status: 200, headers: { "content-type": "application/json" } }));
    expect(result.url).toBe("https://cdn.example.com/generated.png");
    await expect(parseImageGeneratorResponse(new Response(JSON.stringify({ image_url: "https://apis.davidcyril.name.ng/ai/writecream/image" }), { status: 200, headers: { "content-type": "application/json" } }))).rejects.toThrow("no usable image file");
  });

  it("surfaces provider-declared failures", async () => {
    await expect(parseImageGeneratorResponse(new Response(JSON.stringify({ success: false, message: "Generation is temporarily unavailable" }), { status: 200, headers: { "content-type": "application/json" } }))).rejects.toThrow("temporarily unavailable");
  });

  it("accepts direct image responses", async () => {
    const result = await parseImageGeneratorResponse(new Response(new Blob(["image"]), { status: 200, headers: { "content-type": "image/png" } }));
    expect(result.objectUrl).toBe(true);
  });

  it("returns readable errors for empty responses", async () => {
    await expect(parseImageGeneratorResponse(new Response("", { status: 200, headers: { "content-type": "application/json" } }))).rejects.toThrow("returned no image");
  });
});
