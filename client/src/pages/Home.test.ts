import { describe, expect, it } from "vitest";
import { extractDirectMediaUrl, extractSearchItems } from "./Home";

describe("focused homepage XXL search", () => {
  it("extracts nested direct preview media for in-page playback", () => {
    expect(extractDirectMediaUrl({ thumbnail: { preview: "https://cdn.example.test/clip.mp4" } })).toBe("https://cdn.example.test/clip.mp4");
    expect(extractDirectMediaUrl({ url: "https://example.test/watch/123" })).toBeUndefined();
  });

  it("normalizes nested provider results and removes duplicate titles", () => {
    const results = extractSearchItems({
      success: true,
      data: {
        results: [
          { title: "First result", url: "https://example.com/one", thumbnail: "https://cdn.example/one.jpg", duration: "03:20" },
          { title: "First result", url: "https://example.com/duplicate" },
          { name: "Second result", link: "https://example.com/two", views: 1200 },
        ],
      },
    });
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ title: "First result", url: "https://example.com/one", duration: "03:20" });
    expect(results[1]).toMatchObject({ title: "Second result", url: "https://example.com/two", views: "1200" });
  });

  it("returns no items for an empty or unrelated payload", () => {
    expect(extractSearchItems({ success: true, data: [] })).toEqual([]);
    expect(extractSearchItems({ message: "No results" })).toEqual([]);
  });
});


describe("focused homepage Xvideo playback", () => {
  it("extracts direct video files from nested API results", async () => {
    const { extractVideoItems } = await import("./Home");
    const results = extractVideoItems({ data: [{ title: "Demo clip", videoUrl: "https://cdn.example/demo.mp4", thumbnail: "https://cdn.example/demo.jpg" }, { title: "Page only", url: "https://example.com/watch" }] });
    expect(results).toEqual([{ title: "Demo clip", mediaUrl: "https://cdn.example/demo.mp4", thumbnail: "https://cdn.example/demo.jpg", duration: undefined }]);
  });
});
