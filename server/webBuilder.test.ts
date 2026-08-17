import { describe, expect, it } from "vitest";
import { parseLlamaScoutResponse, parseWebDraftContent, renderWebDraftHtml, WebDraftSchema } from "./webBuilder";

const draft = {
  title: "Studio <One>",
  tagline: "A clear creative home.",
  primaryColor: "#2c8cff",
  accentColor: "#ff4e6e",
  sections: [{ heading: "Services", body: "Portraits & launches", ctaLabel: "Book now" }],
  footer: "Built with ELIZZY Studio",
};

const response = (body: string, ok = true, status = 200) => ({ ok, status, text: async () => body });

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

  it("parses the supplied LLAMA 4 SCOUT envelope", async () => {
    const payload = await parseLlamaScoutResponse(response(JSON.stringify({ success: true, model: "llama-4-scout", data: "```html\n<h1>Hello</h1>\n```" })));
    expect(payload.success).toBe(true);
    expect(payload.model).toBe("llama-4-scout");
    expect(payload.data).toContain("<h1>Hello</h1>");
  });

  it("turns empty, malformed, and invalid responses into actionable errors", async () => {
    await expect(parseLlamaScoutResponse(response(""))).rejects.toThrow("empty response");
    await expect(parseLlamaScoutResponse(response('{"success":'))).rejects.toThrow("unreadable response");
    await expect(parseLlamaScoutResponse(response("[]"))).rejects.toThrow("invalid response");
    expect(() => parseWebDraftContent("")).toThrow("empty website draft");
    expect(() => parseWebDraftContent('{"title":"Incomplete')).toThrow("incomplete website draft");
  });
});
