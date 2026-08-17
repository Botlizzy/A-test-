import { describe, expect, it } from "vitest";
import { parseAICoderResponse, parseWebDraftContent, renderWebDraftHtml, WebDraftSchema } from "./webBuilder";

const draft = {
  title: "Studio <One>",
  tagline: "A clear creative home.",
  primaryColor: "#2c8cff",
  accentColor: "#ff4e6e",
  sections: [{ heading: "Services", body: "Portraits & launches", ctaLabel: "Book now" }],
  footer: "Built with ELIZZY Studio",
};

describe("AI web builder draft contract", () => {
  it("accepts the controlled structured draft shape", () => {
    expect(WebDraftSchema.parse(draft).sections).toHaveLength(1);
  });

  it("renders safe static HTML without executable script tags", () => {
    const html = renderWebDraftHtml(draft);
    expect(html).toContain("Studio &lt;One&gt;");
    expect(html).toContain("Services");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });

  it("accepts fenced JSON and structured object content", () => {
    expect(parseWebDraftContent("```json\n" + JSON.stringify(draft) + "\n```").title).toBe("Studio <One>");
    expect(parseWebDraftContent(draft).footer).toContain("ELIZZY");
  });

  it("parses the supplied AI coder artifact envelope", async () => {
    const payload = await parseAICoderResponse({ ok: true, status: 200, text: async () => JSON.stringify({ status: true, result: { model: "GLM-5", total_files: 1, files: ["src/App.tsx"], download_url: "https://tmpfiles.org/dl/example/site.zip", zip_filename: "site.zip" } }) });
    expect(payload.result?.download_url).toContain("https://");
    expect(payload.result?.files).toEqual(["src/App.tsx"]);
  });

  it("turns empty or truncated responses into actionable errors", () => {
    expect(() => parseWebDraftContent("")).toThrow("empty website draft");
    expect(() => parseWebDraftContent('{"title":"Incomplete')).toThrow("incomplete website draft");
  });
});
