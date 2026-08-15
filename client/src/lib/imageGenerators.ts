export const EPICREALISM_IMAGE_ENDPOINT = "https://apis.davidcyril.name.ng/epicrealism";
export const ANIMAGINE_IMAGE_ENDPOINT = "https://apis.davidcyril.name.ng/animagine";

export type ImageGeneratorKind = "epicrealism" | "animagine";
export type ImageGeneratorResult = { url: string; objectUrl: boolean };

export function prepareImagePrompt(prompt: string): string {
  const cleaned = prompt.trim();
  return `Follow this image brief exactly. Include every named subject, action, color, and setting. Do not substitute unrelated content. Brief: ${cleaned}`;
}

export function getImageGeneratorUrl(kind: ImageGeneratorKind, prompt: string, ratio = "1:1"): string {
  const url = new URL(kind === "epicrealism" ? EPICREALISM_IMAGE_ENDPOINT : ANIMAGINE_IMAGE_ENDPOINT);
  url.searchParams.set("prompt", prepareImagePrompt(prompt));
  if (kind === "epicrealism") url.searchParams.set("ratio", ratio);
  return url.toString();
}

function isImageUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\/[^\s]+$/i.test(value) && !/apis\.davidcyril\.name\.ng/i.test(value);
}

function findImageUrl(value: unknown): string | null {
  if (typeof value === "string") return isImageUrl(value) && (/\.(png|jpe?g|webp|gif|avif)(?:$|[?#])/i.test(value) || /image|img|output|result|url/i.test(value)) ? value : null;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findImageUrl(item); if (found) return found; }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/image|img|output|result|url|src|file/i.test(key)) { const found = findImageUrl(child); if (found) return found; }
    }
    for (const child of Object.values(value)) { const found = findImageUrl(child); if (found) return found; }
  }
  return null;
}

export async function parseImageGeneratorResponse(response: Response): Promise<ImageGeneratorResult> {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Image provider returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : "."}`);
  }
  if (contentType.startsWith("image/")) {
    const blob = await response.blob();
    return { url: URL.createObjectURL(blob), objectUrl: true };
  }
  const raw = await response.text().catch(() => "");
  if (!raw.trim()) throw new Error("The image provider returned no image. Try a different prompt.");
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { throw new Error("The image provider returned an unreadable response. Please try again."); }
  if (payload && typeof payload === "object" && "success" in payload && payload.success === false) {
    const message = "message" in payload && typeof payload.message === "string" ? payload.message : "The image provider could not generate this image.";
    throw new Error(message);
  }
  const imageUrl = findImageUrl(payload);
  if (!imageUrl) throw new Error("The image provider returned no usable image file. Try again with a more specific prompt.");
  return { url: imageUrl, objectUrl: false };
}
