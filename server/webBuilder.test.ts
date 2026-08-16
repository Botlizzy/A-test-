import { describe, expect, it } from "vitest";
import { renderWebDraftHtml, WebDraftSchema } from "./webBuilder";

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
});
