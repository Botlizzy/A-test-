import { describe, expect, it } from "vitest";
import { extractSearchItems } from "./Home";

describe("focused homepage XXL search", () => {
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
