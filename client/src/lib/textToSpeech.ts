export const TTS_BASE_URL = "https://apis.davidcyril.name.ng";
export const TTS_PATH = "/tools/speechma";

export type TextToSpeechOptions = { text: string; voice?: string; language?: string; pitch?: string; rate?: string };

export function buildTextToSpeechQuery(options: TextToSpeechOptions): URLSearchParams {
  const params = new URLSearchParams();
  params.set("text", options.text.trim());
  if (options.voice?.trim()) params.set("voice", options.voice.trim());
  if (options.language?.trim()) params.set("lang", options.language.trim());
  if (options.pitch?.trim()) params.set("pitch", options.pitch.trim());
  if (options.rate?.trim()) params.set("rate", options.rate.trim());
  return params;
}

export function isAudioContentType(contentType: string | null): boolean {
  return Boolean(contentType && /^(audio|application\/octet-stream)\//i.test(contentType));
}

export function extractSpeechAudioLinks(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown, keyHint = "") => {
    if (typeof node === "string") {
      (node.match(/https?:\/\/[^\s"'\\]+/g) || []).forEach((raw) => {
        const url = raw.replace(/[),.;]+$/, "");
        if (!url.includes("davidcyril.name.ng") && (/\.(mp3|wav|m4a|ogg|opus)(?:$|[?#])/i.test(url) || /audio|speech|voice|sound|file|download|url/i.test(keyHint))) found.push(url);
      });
    } else if (Array.isArray(node)) node.forEach((item) => visit(item, keyHint));
    else if (node && typeof node === "object") Object.entries(node).forEach(([key, child]) => visit(child, key));
  };
  visit(value);
  return Array.from(new Set(found)).slice(0, 4);
}

export function extractBase64Audio(value: unknown): string | null {
  let found: string | null = null;
  const visit = (node: unknown, keyHint = "") => {
    if (found) return;
    if (typeof node === "string" && /audio|speech|voice|sound|base64|file/i.test(keyHint) && /^[A-Za-z0-9+/=\s]{120,}$/.test(node)) found = node.replace(/\s+/g, "");
    else if (Array.isArray(node)) node.forEach((item) => visit(item, keyHint));
    else if (node && typeof node === "object") Object.entries(node).forEach(([key, child]) => visit(child, key));
  };
  visit(value);
  return found;
}

export function safeSpeechFilename(contentType = "audio/mpeg"): string {
  if (/wav/i.test(contentType)) return "eliminator-speech.wav";
  if (/ogg|opus/i.test(contentType)) return "eliminator-speech.ogg";
  return "eliminator-speech.mp3";
}
