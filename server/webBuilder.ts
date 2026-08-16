import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const WebDraftSchema = z.object({
  title: z.string().min(1).max(80),
  tagline: z.string().min(1).max(160),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sections: z.array(z.object({
    heading: z.string().min(1).max(100),
    body: z.string().min(1).max(600),
    ctaLabel: z.string().max(40).optional(),
  })).min(1).max(6),
  footer: z.string().min(1).max(160),
});

export type WebDraft = z.infer<typeof WebDraftSchema>;

const webDraftJsonSchema = {
  name: "web_draft",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      tagline: { type: "string" },
      primaryColor: { type: "string", description: "Six-digit hex color" },
      accentColor: { type: "string", description: "Six-digit hex color" },
      sections: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            body: { type: "string" },
            ctaLabel: { type: "string" },
          },
          required: ["heading", "body", "ctaLabel"],
          additionalProperties: false,
        },
      },
      footer: { type: "string" },
    },
    required: ["title", "tagline", "primaryColor", "accentColor", "sections", "footer"],
    additionalProperties: false,
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

export function renderWebDraftHtml(draft: WebDraft): string {
  const sections = draft.sections.map((section) => `<section><p class="kicker">ELIZZY STUDIO</p><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p>${section.ctaLabel ? `<a href="#contact">${escapeHtml(section.ctaLabel)}</a>` : ""}</section>`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(draft.title)}</title><style>:root{--primary:${draft.primaryColor};--accent:${draft.accentColor}}*{box-sizing:border-box}body{margin:0;background:#08101f;color:#f7fbff;font-family:Inter,system-ui,sans-serif}main{max-width:980px;margin:auto;padding:32px 20px}header{padding:72px 0 48px;border-bottom:1px solid #ffffff22}h1{font-size:clamp(2.4rem,8vw,5.8rem);line-height:.95;margin:.4rem 0;background:linear-gradient(100deg,var(--primary),var(--accent));-webkit-background-clip:text;color:transparent}.tagline{font-size:1.2rem;color:#b5c7dc;max-width:620px}section{padding:52px 0;border-bottom:1px solid #ffffff18}h2{font-size:clamp(1.8rem,4vw,3rem);margin:.3rem 0}section p{line-height:1.7;color:#c8d6e8;max-width:680px}.kicker{font-size:.72rem;letter-spacing:.18em;color:var(--accent);font-weight:800}a{display:inline-block;margin-top:14px;padding:12px 18px;border-radius:999px;background:var(--primary);color:#08101f;text-decoration:none;font-weight:800}footer{padding:32px 0;color:#91a4bc;font-size:.85rem}</style></head><body><main><header><p class="kicker">AI WEB BUILDER</p><h1>${escapeHtml(draft.title)}</h1><p class="tagline">${escapeHtml(draft.tagline)}</p></header>${sections}<footer id="contact">${escapeHtml(draft.footer)}</footer></main></body></html>`;
}

export function parseWebDraftContent(content: unknown): WebDraft {
  if (content && typeof content === "object" && !Array.isArray(content)) return WebDraftSchema.parse(content);
  const raw = Array.isArray(content)
    ? content.map((part) => typeof part === "string" ? part : part && typeof part === "object" && "text" in part ? String((part as { text?: unknown }).text || "") : "").join("")
    : typeof content === "string" ? content : "";
  const normalized = raw.replace(/^```(?:json)?\\s*/i, "").replace(/\\s*```$/i, "").trim();
  if (!normalized) throw new Error("Manus AI returned an empty website draft. Please try again.");
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Manus AI returned an incomplete website draft. Please try again.");
  try {
    return WebDraftSchema.parse(JSON.parse(normalized.slice(start, end + 1)));
  } catch {
    throw new Error("Manus AI returned an invalid website draft. Please try again with a more specific brief.");
  }
}

export async function generateWebDraft(prompt: string): Promise<WebDraft> {
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "You create concise, polished, safe single-page website drafts. Return only the requested JSON structure. Never include scripts, iframes, external HTML, unsafe URLs, or arbitrary code. Use accessible, mobile-first copy." },
      { role: "user", content: `Create a single-page website draft from this brief:\n${prompt}` },
    ],
    maxTokens: 1800,
    outputSchema: webDraftJsonSchema,
  });
  const content = response.choices?.[0]?.message?.content;
  return parseWebDraftContent(content);
}
