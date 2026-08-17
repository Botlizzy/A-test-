import { z } from "zod";

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
export type WebCodeArtifact = { downloadUrl: string; filename: string; files: string[]; model?: string; totalFiles?: number };
export type WebBuilderResult = { draft: WebDraft; artifact: WebCodeArtifact };

type LlamaPayload = { success?: boolean; creator?: string; model?: string; data?: unknown; message?: string; error?: string };
const LLAMA_SCOUT_URL = "https://apis.davidcyril.name.ng/llama-4-scout";

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
  const normalized = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!normalized) throw new Error("AI coder returned an empty website draft. Please try again.");
  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI coder returned an incomplete website draft. Please try again.");
  try { return WebDraftSchema.parse(JSON.parse(normalized.slice(start, end + 1))); }
  catch { throw new Error("AI coder returned an invalid website draft. Please try again with a more specific brief."); }
}

export async function parseLlamaScoutResponse(response: Pick<Response, "ok" | "status" | "text">): Promise<LlamaPayload> {
  const raw = await response.text();
  const body = raw.trim();
  if (!body) throw new Error(response.ok ? "The AI coder returned an empty response. Please try again." : `The AI coder returned HTTP ${response.status} without an error message.`);
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { throw new Error(response.ok ? "The AI coder returned an unreadable response. Please try again." : `The AI coder returned HTTP ${response.status}.`); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("The AI coder returned an invalid response. Please try again.");
  return payload as LlamaPayload;
}

function safeFilename(value: unknown): string {
  const filename = typeof value === "string" ? value.trim() : "";
  return /^[\w.-]+\.(zip|md|html|txt)$/i.test(filename) ? filename : "llama-4-scout-website.md";
}

function extractGeneratedCode(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) return value.map((part) => typeof part === "string" ? part : part && typeof part === "object" && "text" in part ? String((part as { text?: unknown }).text || "") : "").join("\n").trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["content", "text", "answer", "response", "code"]) {
      const found = extractGeneratedCode(record[key]);
      if (found) return found;
    }
  }
  return "";
}

function makeDownloadArtifact(code: string, model: string): WebCodeArtifact {
  const encoded = Buffer.from(code, "utf8").toString("base64");
  return { downloadUrl: `data:text/markdown;base64,${encoded}`, filename: safeFilename(`${model}-website.md`), files: ["README.md"], model, totalFiles: 1 };
}

function buildSafeDraft(prompt: string, artifact: WebCodeArtifact): WebDraft {
  const title = prompt.trim().split(/[.!?\n]/)[0].slice(0, 72).trim() || "AI Coder Website";
  return {
    title,
    tagline: "A safe preview of the website generated by the AI coder.",
    primaryColor: "#2c8cff",
    accentColor: "#ff4e6e",
    sections: [
      { heading: "Generated project", body: `The AI coder prepared ${artifact.totalFiles || artifact.files.length || 1} file${(artifact.totalFiles || artifact.files.length || 1) === 1 ? "" : "s"}. Download the ZIP to continue editing the generated source.`, ctaLabel: "Download code" },
      { heading: "Requested brief", body: prompt.trim().slice(0, 600) },
    ],
    footer: "Generated safely by ELIZZY DOMAIN AI Coder.",
  };
}

export async function generateWebDraft(prompt: string): Promise<WebBuilderResult> {
  const endpoint = new URL(LLAMA_SCOUT_URL);
  endpoint.searchParams.set("prompt", `Act as a senior web developer. Generate a complete mobile-first website project for this brief. Return the implementation as Markdown with fenced files such as index.html, styles.css, and script.js, followed by a short implementation summary. Brief: ${prompt.trim()}`);
  let response: Response;
  try { response = await fetch(endpoint, { headers: { Accept: "application/json" } }); }
  catch { throw new Error("Llama 4 Scout could not be reached. Please try again."); }
  const raw = await response.text();
  const body = raw.trim();
  if (!body) throw new Error(response.ok ? "Llama 4 Scout returned an empty website response. Please try again." : `Llama 4 Scout returned HTTP ${response.status}.`);
  let payload: LlamaPayload;
  try { payload = JSON.parse(body) as LlamaPayload; }
  catch { throw new Error("Llama 4 Scout returned an unreadable response. Please try again."); }
  const code = extractGeneratedCode(payload.data);
  if (!response.ok || payload.success !== true || !code) throw new Error(payload.message || payload.error || `Llama 4 Scout returned HTTP ${response.status}.`);
  const model = typeof payload.model === "string" && payload.model.trim() ? payload.model : "llama-4-scout";
  const artifact = makeDownloadArtifact(code, model);
  return { draft: buildSafeDraft(prompt, artifact), artifact };
}
