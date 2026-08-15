import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Catalog = { count: number; endpoints: Array<{ category: string; path: string; alias: string; method: string; tags: string[] }> };

describe("multi-tool API catalog", () => {
  it("contains the documented endpoint families with usable metadata", () => {
    const catalog = JSON.parse(readFileSync(resolve(process.cwd(), "client/src/data/apiCatalog.json"), "utf8")) as Catalog;
    expect(catalog.count).toBeGreaterThanOrEqual(400);
    expect(catalog.endpoints.length).toBe(catalog.count);
    expect(new Set(catalog.endpoints.map((item) => item.category)).size).toBeGreaterThanOrEqual(18);
    expect(catalog.endpoints.every((item) => item.path.startsWith("/") && item.alias && item.method && Array.isArray(item.tags))).toBe(true);
    expect(catalog.endpoints.some((item) => item.path === "/download/savetik")).toBe(true);
    expect(catalog.endpoints.some((item) => item.category === "xxx")).toBe(true);
  });
});
