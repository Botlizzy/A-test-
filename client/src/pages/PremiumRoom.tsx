import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, CircleAlert, Download, LockKeyhole, LogOut, Play, RefreshCw, Sparkles, Trophy, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import PremiumBadge from "@/components/PremiumBadge";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";
import { getTikTokBoostUrl, isTikTokTarget, type TikTokBoostType } from "@/lib/tiktokBoost";
import { getYouTubeBoostUrl, isYouTubeTarget, type YouTubeBoostType } from "@/lib/youtubeBoost";
import { getApkDownloaderUrl, getOfficialStoreLinks, isApkSearch, isAuthorizedPackageUrl, type ApkResult } from "@/lib/apkDownloader";
import { extractPremiumAiText, getPremiumAiUrl, PREMIUM_AI_MODELS, type PremiumAiModel } from "@/lib/premiumAi";
import { getImageGeneratorUrl, parseImageGeneratorResponse, type ImageGeneratorKind } from "@/lib/imageGenerators";
import { fetchLiveScores, LIVE_SCORES_REFRESH_MS, type LiveMatch } from "@/lib/liveScores";
import { buildMurekaCreatePayload, extractMurekaAudioTracks, extractMurekaTaskId, isMurekaTerminal, safeMurekaFilename, MUREKA_BASE_URL, MUREKA_CREATE_PATH, MUREKA_STATUS_PATH } from "@/lib/murekaMusic";

type PremiumRoomProps = { user: User; isPremium: boolean; onBack: () => void; onPricing: () => void; onSignOut: () => Promise<void> };
type BoostResult = Record<string, unknown> & { success?: boolean; message?: string; status?: string; status_url?: string; statusUrl?: string; poll_url?: string; pollUrl?: string };

export function getBoostStatusUrl(result: BoostResult): string | null {
  const candidate = result.status_url || result.statusUrl || result.poll_url || result.pollUrl;
  if (typeof candidate !== "string" || !/^https?:\/\//i.test(candidate)) return null;
  return candidate;
}

export function isTerminalBoostStatus(result: BoostResult): boolean {
  const status = typeof result.status === "string" ? result.status.toLowerCase() : "";
  return ["complete", "completed", "success", "failed", "error", "cancelled", "canceled"].includes(status) || result.success === true || result.success === false;
}

function boostOutcomeLabel(result: BoostResult): string {
  const status = typeof result.status === "string" ? result.status.toLowerCase() : "";
  if (["failed", "error", "cancelled", "canceled"].includes(status) || result.success === false) return "Boost failed";
  if (["pending", "queued", "processing", "running"].includes(status)) return "Boost pending — provider is still working";
  if (["complete", "completed", "success"].includes(status) || result.success === true) return "Boost confirmed by provider";
  return "Provider response — completion not confirmed";
}

function boostResultClass(result: BoostResult): string {
  const label = boostOutcomeLabel(result);
  if (label === "Boost confirmed by provider") return "premium-boost-result premium-boost-result--confirmed";
  if (label === "Boost pending — provider is still working") return "premium-boost-result premium-boost-result--pending";
  if (label === "Boost failed") return "premium-boost-result premium-boost-result--failed";
  return "premium-boost-result premium-boost-result--notice";
}

async function followBoostStatus(initial: BoostResult, onProgress: (result: BoostResult) => void): Promise<BoostResult> {
  const statusUrl = getBoostStatusUrl(initial);
  if (!statusUrl || isTerminalBoostStatus(initial)) return initial;
  let latest = initial;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    const response = await fetch(statusUrl, { headers: { Accept: "application/json" } });
    const next = (await response.json().catch(() => ({}))) as BoostResult;
    latest = { ...latest, ...next };
    onProgress(latest);
    if (isTerminalBoostStatus(latest)) return latest;
  }
  return { ...latest, status: latest.status || "pending", message: latest.message || "The provider has not reported a terminal result yet. Keep the target under review in the provider dashboard." };
}
type PremiumAppConfig = { id: string; name: string; eyebrow: string; description: string; path: string; field: "url" | "text"; placeholder: string; action: string };
export const PREMIUM_DOWNLOADER_PATHS = { facebook: "/facebook3", tiktok: "/download/tiktokv4", youtube: "/download/ytmp444" } as const;
const PREMIUM_APPS: PremiumAppConfig[] = [
  { id: "facebook-download", name: "Facebook Save Lab", eyebrow: "FACEBOOK VIDEO", description: "Paste a Facebook video link and receive the exact returned video file with preview and download actions.", path: PREMIUM_DOWNLOADER_PATHS.facebook, field: "url", placeholder: "https://www.facebook.com/share/v/...", action: "Fetch Facebook video" },
  { id: "tiktok-download", name: "TikTok Save Lab", eyebrow: "TIKTOK VIDEO", description: "Use the documented TikTok V4 endpoint to return the exact media file when the provider supplies one.", path: PREMIUM_DOWNLOADER_PATHS.tiktok, field: "url", placeholder: "https://www.tiktok.com/@name/video/...", action: "Fetch TikTok video" },
  { id: "youtube-download", name: "YouTube Export", eyebrow: "YOUTUBE MP4", description: "Use YouTube MP4 V2 and expose the exact returned file with native preview and download actions.", path: PREMIUM_DOWNLOADER_PATHS.youtube, field: "url", placeholder: "https://www.youtube.com/watch?v=...", action: "Prepare YouTube file" },
  { id: "apk-vault", name: "APK Vault", eyebrow: "APP FINDER", description: "Search an app name and review package information plus returned download links.", path: "/download/apk", field: "text", placeholder: "WhatsApp, Telegram, Spotify…", action: "Find app package" },
  { id: "aio-download", name: "Universal Save Desk", eyebrow: "ALL-IN-ONE", description: "Use one guided URL input for supported media sources.", path: "/download/aio", field: "url", placeholder: "Paste a supported media URL…", action: "Run save desk" },
  { id: "website-download", name: "Web Capture", eyebrow: "WEB UTILITY", description: "Submit a public page URL and review the exact returned capture metadata.", path: "/tools/downloadweb", field: "url", placeholder: "https://example.com/page", action: "Capture page" },
];

function isDirectMediaCandidate(url: string, keyHint: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("davidcyril.name.ng") || host.includes("localhost") || host.includes("127.0.0.1") || host.includes("api.")) return false;
    if (/facebook\.com$|fb\.watch$|tiktok\.com$|youtube\.com$|youtu\.be$|instagram\.com$/.test(host)) return false;
    const hasMediaExtension = /\.(mp4|webm|mov|m4v|mp3|wav|m4a|ogg|opus)(?:$|[?#])/i.test(url);
    const strongMediaKey = /^(download_?url|media_?url|video_?url|audio_?url|direct_?url|file_?url|download|media|video|audio|stream|file)$/i.test(keyHint.replace(/[^a-z]/gi, ""));
    const looksLikeDownloadPath = /\/(download|media|video|audio|stream|file)(?:[/?]|$)/i.test(parsed.pathname) || parsed.searchParams.has("token");
    return hasMediaExtension || strongMediaKey || looksLikeDownloadPath;
  } catch {
    return false;
  }
}

export function findReturnedMediaLinks(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown, keyHint = "") => {
    if (typeof node === "string") {
      const urls = node.match(/https?:\/\/[^\s"'\\]+/g) || [];
      urls.forEach((raw) => {
        const url = raw.replace(/[),.;]+$/, "");
        if (isDirectMediaCandidate(url, keyHint)) found.push(url);
      });
      return;
    }
    if (Array.isArray(node)) { node.forEach((item) => visit(item, keyHint)); return; }
    if (node && typeof node === "object") Object.entries(node).forEach(([key, child]) => visit(child, key));
  };
  visit(value);
  return Array.from(new Set(found)).slice(0, 8);
}

function safeReturnedFileName(url: string): string { try { const name = new URL(url).pathname.split("/").pop() || "eliminator-file"; return name.replace(/[^a-z0-9._-]+/gi, "-").slice(0, 96); } catch { return "eliminator-file"; } }

export default function PremiumRoom({ user, isPremium, onBack, onPricing, onSignOut }: PremiumRoomProps) {
  const [boostTarget, setBoostTarget] = useState("");
  const [boostType, setBoostType] = useState<TikTokBoostType>("video_views");
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostResult, setBoostResult] = useState<BoostResult | null>(null);
  const [boostError, setBoostError] = useState("");
  const [youtubeTarget, setYoutubeTarget] = useState("");
  const [youtubeType, setYoutubeType] = useState<YouTubeBoostType>("views");
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeResult, setYoutubeResult] = useState<BoostResult | null>(null);
  const [youtubeError, setYoutubeError] = useState("");
  const [apkSearch, setApkSearch] = useState("");
  const [apkLoading, setApkLoading] = useState(false);
  const [apkResult, setApkResult] = useState<ApkResult | null>(null);
  const [apkError, setApkError] = useState("");
  const [premiumApp, setPremiumApp] = useState(PREMIUM_APPS[0]);
  const [premiumAppInput, setPremiumAppInput] = useState("");
  const [premiumAppLoading, setPremiumAppLoading] = useState(false);
  const [premiumAppProgress, setPremiumAppProgress] = useState(0);
  const [premiumAppStage, setPremiumAppStage] = useState("");
  const [premiumAppResult, setPremiumAppResult] = useState<unknown>(null);
  const [fileDownloadState, setFileDownloadState] = useState<Record<string, "idle" | "downloading" | "success" | "error">>({});
  const [premiumAppError, setPremiumAppError] = useState("");
  const [aiModel, setAiModel] = useState<PremiumAiModel>(PREMIUM_AI_MODELS[0]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageRatio, setImageRatio] = useState("1:1");
  const [animePrompt, setAnimePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [generatedImageKind, setGeneratedImageKind] = useState<ImageGeneratorKind | null>(null);
  const [imageLoading, setImageLoading] = useState<ImageGeneratorKind | null>(null);
  const [imageError, setImageError] = useState("");
  const [submittedImagePrompt, setSubmittedImagePrompt] = useState("");
  const [imageDownloadState, setImageDownloadState] = useState<"idle" | "downloading" | "success" | "error">("idle");
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [liveScoresLoading, setLiveScoresLoading] = useState(false);
  const [liveScoresError, setLiveScoresError] = useState("");
  const [murekaPrompt, setMurekaPrompt] = useState("");
  const [murekaTitle, setMurekaTitle] = useState("");
  const [murekaStyle, setMurekaStyle] = useState("");
  const [murekaLyrics, setMurekaLyrics] = useState("");
  const [murekaInstrumental, setMurekaInstrumental] = useState(false);
  const [murekaLoading, setMurekaLoading] = useState(false);
  const [murekaProgress, setMurekaProgress] = useState(0);
  const [murekaStage, setMurekaStage] = useState("");
  const [murekaTracks, setMurekaTracks] = useState<string[]>([]);
  const [murekaRawResult, setMurekaRawResult] = useState<unknown>(null);
  const [murekaError, setMurekaError] = useState("");
  const [murekaDownloadState, setMurekaDownloadState] = useState<Record<string, "idle" | "downloading" | "success" | "error">>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const submitBoost = async (event: FormEvent) => {
    event.preventDefault();
    setBoostError("");
    setBoostResult(null);
    if (!isTikTokTarget(boostTarget, boostType)) {
      setBoostError(boostType === "followers" ? "Enter a TikTok profile URL or @username for followers." : "Enter a full TikTok video URL for this service.");
      return;
    }
    setBoostLoading(true);
    try {
      const response = await fetch(getTikTokBoostUrl(boostTarget, boostType), { headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => ({ success: false, message: `The service returned HTTP ${response.status}.` }))) as BoostResult;
      setBoostResult(payload);
      const finalResult = response.ok ? await followBoostStatus(payload, setBoostResult) : payload;
      setBoostResult(finalResult);
      if (!response.ok) setBoostError(`The boost service returned HTTP ${response.status}.`);
    } catch (cause) {
      setBoostError(cause instanceof Error ? cause.message : "The TikTok Boost service is unavailable.");
    } finally {
      setBoostLoading(false);
    }
  };

  const submitYouTubeBoost = async (event: FormEvent) => {
    event.preventDefault();
    setYoutubeError("");
    setYoutubeResult(null);
    if (!isYouTubeTarget(youtubeTarget, youtubeType)) {
      setYoutubeError(youtubeType === "subscribers" ? "Enter a YouTube channel URL or @handle for subscribers." : "Enter a full YouTube video URL for this service.");
      return;
    }
    setYoutubeLoading(true);
    try {
      const response = await fetch(getYouTubeBoostUrl(youtubeTarget, youtubeType), { headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => ({ success: false, message: `The service returned HTTP ${response.status}.` }))) as BoostResult;
      setYoutubeResult(payload);
      const finalResult = response.ok ? await followBoostStatus(payload, setYoutubeResult) : payload;
      setYoutubeResult(finalResult);
      if (!response.ok) setYoutubeError(`The YouTube boost service returned HTTP ${response.status}.`);
    } catch (cause) {
      setYoutubeError(cause instanceof Error ? cause.message : "The YouTube Boost service is unavailable.");
    } finally {
      setYoutubeLoading(false);
    }
  };

  const submitApkSearch = async (event: FormEvent) => {
    event.preventDefault();
    setApkError("");
    setApkResult(null);
    if (!isApkSearch(apkSearch)) {
      setApkError("Enter an app name between 2 and 80 characters.");
      return;
    }
    setApkLoading(true);
    try {
      const stores = getOfficialStoreLinks(apkSearch);
      const response = await fetch(getApkDownloaderUrl(apkSearch), { headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => ({ status: false }))) as ApkResult;
      const safePackage = payload.apk?.downloadLink && isAuthorizedPackageUrl(payload.apk.downloadLink) ? payload.apk.downloadLink : undefined;
      setApkResult({ ...payload, query: apkSearch.trim(), stores, apk: payload.apk ? { ...payload.apk, downloadLink: safePackage } : undefined });
      if (!response.ok && !payload.apk) setApkError("Store links are ready. The optional catalog metadata service did not respond.");
    } catch {
      setApkResult({ query: apkSearch.trim(), stores: getOfficialStoreLinks(apkSearch), status: false });
      setApkError("Official store links are ready. Optional app metadata was unavailable.");
    } finally {
      setApkLoading(false);
    }
  };

  const downloadReturnedFile = async (url: string) => {
    setFileDownloadState((current) => ({ ...current, [url]: "downloading" }));
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`File request failed (${response.status})`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeReturnedFileName(url);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setFileDownloadState((current) => ({ ...current, [url]: "success" }));
    } catch {
      setFileDownloadState((current) => ({ ...current, [url]: "error" }));
    }
  };

  const runPremiumApp = async (event: FormEvent) => {
    event.preventDefault();
    setPremiumAppError("");
    setPremiumAppResult(null);
    if (premiumAppInput.trim().length < 2) {
      setPremiumAppError(premiumApp.field === "url" ? "Paste a valid public URL to continue." : "Enter an app name to continue.");
      return;
    }
    setPremiumAppLoading(true);
    setPremiumAppProgress(12);
    setPremiumAppStage("Connecting to the downloader…");
    try {
      const target = new URL(`https://apis.davidcyril.name.ng${premiumApp.path}`);
      target.searchParams.set(premiumApp.field, premiumAppInput.trim());
      const response = await fetch(target.toString(), { headers: { Accept: "application/json" } });
      setPremiumAppProgress(54);
      setPremiumAppStage("Reading the provider response…");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || `Service returned HTTP ${response.status}.`);
      setPremiumAppProgress(82);
      setPremiumAppStage("Preparing the returned media file…");
      setPremiumAppResult(payload);
      setPremiumAppProgress(100);
      setPremiumAppStage("File ready when a direct media URL is supplied.");
    } catch (cause) {
      setPremiumAppError(cause instanceof Error ? cause.message : "The Premium app could not complete the request.");
    } finally {
      setPremiumAppLoading(false);
    }
  };

  const generateMurekaTrack = async (event: FormEvent) => {
    event.preventDefault();
    const prompt = murekaPrompt.trim();
    if (prompt.length < 3 || murekaLoading) return;
    setMurekaError("");
    setMurekaTracks([]);
    setMurekaRawResult(null);
    setMurekaProgress(8);
    setMurekaStage("Writing your music brief…");
    setMurekaLoading(true);
    try {
      const createResponse = await fetch(`${MUREKA_BASE_URL}${MUREKA_CREATE_PATH}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(buildMurekaCreatePayload({ prompt, title: murekaTitle, style: murekaStyle, lyrics: murekaLyrics, instrumental: murekaInstrumental })) });
      const initial = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok) throw new Error(initial?.message || `Mureka returned HTTP ${createResponse.status}.`);
      setMurekaRawResult(initial);
      const immediateTracks = extractMurekaAudioTracks(initial);
      if (immediateTracks.length) { setMurekaTracks(immediateTracks); setMurekaProgress(100); setMurekaStage("Full track ready to play and download."); return; }
      const taskId = extractMurekaTaskId(initial);
      if (!taskId) throw new Error("Mureka accepted the request but did not return a task ID or a complete audio file.");
      let latest = initial;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        setMurekaProgress(Math.min(94, 18 + Math.round((attempt / 20) * 76)));
        setMurekaStage(`Rendering your track… check ${attempt + 1} of 20`);
        await new Promise((resolve) => window.setTimeout(resolve, 1800));
        const statusUrl = new URL(`${MUREKA_BASE_URL}${MUREKA_STATUS_PATH}`);
        statusUrl.searchParams.set("taskId", taskId);
        statusUrl.searchParams.set("task_id", taskId);
        statusUrl.searchParams.set("id", taskId);
        const statusResponse = await fetch(statusUrl.toString(), { headers: { Accept: "application/json" } });
        const next = await statusResponse.json().catch(() => ({}));
        if (!statusResponse.ok) throw new Error(next?.message || `Mureka status returned HTTP ${statusResponse.status}.`);
        latest = next;
        setMurekaRawResult(latest);
        const tracks = extractMurekaAudioTracks(latest);
        if (tracks.length) { setMurekaTracks(tracks); setMurekaProgress(100); setMurekaStage("Full track ready to play and download."); return; }
        if (isMurekaTerminal(latest)) throw new Error(latest?.message || "Mureka finished without returning a complete audio file.");
      }
      throw new Error("Mureka is still rendering this track. No download button was shown because the complete audio file is not ready yet.");
    } catch (cause) {
      setMurekaError(cause instanceof Error ? cause.message : "Mureka could not generate this track.");
    } finally {
      setMurekaLoading(false);
    }
  };

  const downloadMurekaTrack = async (url: string, index: number) => {
    setMurekaDownloadState((current) => ({ ...current, [url]: "downloading" }));
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Track request failed (${response.status})`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeMurekaFilename(url, index);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setMurekaDownloadState((current) => ({ ...current, [url]: "success" }));
    } catch {
      setMurekaDownloadState((current) => ({ ...current, [url]: "error" }));
    }
  };

  const downloadGeneratedImage = async (filename: string) => {
    if (!generatedImageUrl || imageDownloadState === "downloading") return;
    setImageDownloadState("downloading");
    try {
      const response = await fetch(generatedImageUrl);
      if (!response.ok) throw new Error("The generated image could not be fetched.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setImageDownloadState("success");
    } catch {
      setImageDownloadState("error");
      window.open(generatedImageUrl, "_blank", "noopener,noreferrer");
    }
  };

  const generateProviderImage = async (event: FormEvent, kind: ImageGeneratorKind) => {
    event.preventDefault();
    const prompt = (kind === "epicrealism" ? imagePrompt : animePrompt).trim();
    if (prompt.length < 3 || imageLoading) return;
    setImageError("");
    setSubmittedImagePrompt(prompt);
    setGeneratedImageUrl("");
    setGeneratedImageKind(null);
    setImageDownloadState("idle");
    setImageLoading(kind);
    try {
      const response = await fetch(getImageGeneratorUrl(kind, prompt, imageRatio), { headers: { Accept: "application/json, image/*" } });
      const result = await parseImageGeneratorResponse(response);
      setGeneratedImageUrl(result.url);
      setGeneratedImageKind(kind);
    } catch (cause) {
      setImageError(cause instanceof Error ? cause.message : "The image provider could not generate an image.");
    } finally {
      setImageLoading(null);
    }
  };

  const sendAiMessage = async (event: FormEvent) => {
    event.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt || aiLoading) return;
    setAiError("");
    setAiPrompt("");
    setAiMessages((current) => [...current, { role: "user", text: prompt }]);
    setAiLoading(true);
    try {
      const response = await fetch(getPremiumAiUrl(aiModel, prompt), { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      const text = extractPremiumAiText(payload);
      if (!response.ok || !text) throw new Error(typeof payload?.message === "string" ? payload.message : `The selected AI returned no readable reply (${response.status}).`);
      setAiMessages((current) => [...current, { role: "assistant", text }]);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "The selected AI could not reply right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const loadLiveScores = async () => {
    setLiveScoresLoading(true);
    setLiveScoresError("");
    try {
      setLiveMatches(await fetchLiveScores());
    } catch (cause) {
      setLiveScoresError(cause instanceof Error ? cause.message : "LiveScore could not load right now.");
      setLiveMatches([]);
    } finally {
      setLiveScoresLoading(false);
    }
    };
  useEffect(() => {
    void loadLiveScores();
    const refreshTimer = window.setInterval(() => { void loadLiveScores(); }, LIVE_SCORES_REFRESH_MS);
    return () => window.clearInterval(refreshTimer);
  }, []);
  const activeContent = (

    <>
      <section className="premium-ai-chat"><div className="premium-ai-chat__heading"><div><span className="eyebrow eyebrow--red">PREMIUM AI CHAT</span><h2>Talk to the model, not the JSON.</h2><p>Choose an AI from the curated catalog, write a prompt, and continue the conversation with readable replies.</p></div><span className="premium-api-board__count">{PREMIUM_AI_MODELS.length} AIS</span></div><div className="premium-ai-models">{PREMIUM_AI_MODELS.map((model) => <button key={model.id} className={aiModel.id === model.id ? "is-active" : ""} onClick={() => { setAiModel(model); setAiError(""); }}>{model.name}<small>{model.provider}</small></button>)}</div><div className="premium-ai-thread">{aiMessages.length === 0 ? <div className="premium-ai-empty"><Sparkles size={22} /><strong>Start a private conversation</strong><span>Ask for an explanation, plan, rewrite, idea, or answer.</span></div> : aiMessages.map((message, index) => <div className={`premium-ai-message premium-ai-message--${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "user" ? "YOU" : aiModel.name.toUpperCase()}</span><p>{message.text}</p></div>)}{aiLoading && <div className="premium-ai-message premium-ai-message--assistant"><span>{aiModel.name.toUpperCase()}</span><p className="ai-thinking">Thinking…</p></div>}</div><form className="premium-ai-composer" onSubmit={sendAiMessage}><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder={`Message ${aiModel.name}…`} rows={3} /><button className="red-button" type="submit" disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}{aiLoading ? "Waiting for reply…" : "Send prompt"}</button></form>{aiError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{aiError}</span></div>}</section><section id="premium-image-generator" className="premium-tool-card premium-tool-card--image"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">CREATOR DESK / EPICREALISM IMAGE</span><h2>Generate a polished image.</h2></div><Sparkles size={22} /></div><p className="premium-tool-card__lead">EpicRealism turns your prompt into an image file. Choose a ratio, wait for the provider response, preview the result, and download the image.</p><form className="premium-boost-form" onSubmit={(event) => generateProviderImage(event, "epicrealism")}><label>Image prompt<textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} placeholder="A cinematic sunset over Lagos with warm amber light…" rows={4} maxLength={1200} /></label><label>Aspect ratio<select value={imageRatio} onChange={(event) => setImageRatio(event.target.value)}><option value="1:1">1:1 square</option><option value="16:9">16:9 landscape</option><option value="9:16">9:16 portrait</option><option value="4:3">4:3 classic</option><option value="3:4">3:4 portrait</option></select></label><button className="red-button premium-boost-submit" type="submit" disabled={imageLoading !== null || imagePrompt.trim().length < 3}>{imageLoading === "epicrealism" ? <><RefreshCw size={16} className="spin" />Generating…</> : <><Sparkles size={16} />Generate image</>}</button></form>{imageLoading === "epicrealism" && <div className="premium-boost-status premium-boost-status--loading"><span className="premium-boost-status__icon"><RefreshCw size={15} className="spin" /></span><div><strong>EpicRealism is generating…</strong><p>Waiting for the image file and preparing the preview.</p><div className="image-generation-progress" role="progressbar" aria-label="EpicRealism generation in progress"><span /></div></div></div>}{imageError && generatedImageKind !== "animagine" && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{imageError}</span></div>}{generatedImageUrl && generatedImageKind === "epicrealism" && <div className="premium-generated-image"><div className="premium-generated-image__meta"><strong>EpicRealism result</strong><span>Requested prompt: {submittedImagePrompt}</span></div><img src={generatedImageUrl} alt={imagePrompt || "EpicRealism generated image"} /><button className="red-button" type="button" onClick={() => downloadGeneratedImage("eliminator-epicrealism-image.png")} disabled={imageDownloadState === "downloading"}><Download size={16} />{imageDownloadState === "downloading" ? "Saving image…" : imageDownloadState === "success" ? "Image saved" : imageDownloadState === "error" ? "Open image" : "Save / download image"}</button></div>}</section><section id="premium-anime-generator" className="premium-tool-card premium-tool-card--image"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">CREATOR DESK / ANIME IMAGE</span><h2>Generate an anime image.</h2></div><Sparkles size={22} /></div><p className="premium-tool-card__lead">Animagine creates anime-style artwork from your prompt. Describe the character, scene, lighting, and style you want.</p><form className="premium-boost-form" onSubmit={(event) => generateProviderImage(event, "animagine")}><label>Anime prompt<textarea value={animePrompt} onChange={(event) => setAnimePrompt(event.target.value)} placeholder="Anime traveler under cherry blossoms, detailed, cinematic lighting…" rows={4} maxLength={1200} /></label><button className="red-button premium-boost-submit" type="submit" disabled={imageLoading !== null || animePrompt.trim().length < 3}>{imageLoading === "animagine" ? <><RefreshCw size={16} className="spin" />Generating…</> : <><Sparkles size={16} />Generate anime image</>}</button></form>{imageLoading === "animagine" && <div className="premium-boost-status premium-boost-status--loading"><span className="premium-boost-status__icon"><RefreshCw size={15} className="spin" /></span><div><strong>Animagine is generating…</strong><p>Waiting for the anime image file and preparing the preview.</p><div className="image-generation-progress" role="progressbar" aria-label="Animagine generation in progress"><span /></div></div></div>}{imageError && generatedImageKind !== "epicrealism" && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{imageError}</span></div>}{generatedImageUrl && generatedImageKind === "animagine" && <div className="premium-generated-image"><div className="premium-generated-image__meta"><strong>Animagine result</strong><span>Requested prompt: {submittedImagePrompt}</span></div><img src={generatedImageUrl} alt={animePrompt || "Animagine generated image"} /><button className="red-button" type="button" onClick={() => downloadGeneratedImage("eliminator-anime-image.png")} disabled={imageDownloadState === "downloading"}><Download size={16} />{imageDownloadState === "downloading" ? "Saving image…" : imageDownloadState === "success" ? "Image saved" : imageDownloadState === "error" ? "Open image" : "Save / download anime image"}</button></div>}</section><section id="premium-live-scores" className="premium-tool-card premium-live-scores"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM SPORTS DESK</span><h2>LiveScore center.</h2></div><button className="tool-download" type="button" onClick={loadLiveScores} disabled={liveScoresLoading}>{liveScoresLoading ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}{liveScoresLoading ? "Updating…" : "Refresh scores"}</button></div><p className="premium-tool-card__lead">See live and scheduled football matches in a compact leaderboard. Scores refresh automatically every minute—no endpoint links or raw response required.</p>{liveScoresLoading && <div className="premium-download-progress" aria-live="polite"><div className="premium-download-progress__heading"><span><RefreshCw size={15} className="spin" />Updating live scores</span><strong>FOOTBALL</strong></div><div className="premium-download-progress__track premium-download-progress__track--indeterminate" role="progressbar" aria-label="Updating live scores"><span /></div><p>Fetching the latest leagues, teams, scores, and game status.</p></div>}{liveScoresError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{liveScoresError}</span></div>}{!liveScoresLoading && !liveScoresError && liveMatches.length === 0 && <div className="premium-live-empty"><Trophy size={22} /><strong>No football games found</strong><span>Football scores refresh automatically when matches are live or scheduled.</span></div>}{liveMatches.length > 0 && <div className="premium-live-grid">{liveMatches.map((match) => <article className="premium-match-card" key={`${match.league}-${match.id}`}><div className="premium-match-card__top"><span>{match.leagueLabel}</span><b className={/progress|live|in progress/i.test(match.status) ? "is-live" : ""}>{match.status}</b></div><div className="premium-match-card__teams"><div className={match.away.winner ? "is-winner" : ""}>{match.away.logo ? <img src={match.away.logo} alt="" /> : <span className="premium-team-fallback">A</span>}<strong>{match.away.shortName || match.away.name}</strong><em>{match.away.score ?? "–"}</em></div><div className={match.home.winner ? "is-winner" : ""}>{match.home.logo ? <img src={match.home.logo} alt="" /> : <span className="premium-team-fallback">H</span>}<strong>{match.home.shortName || match.home.name}</strong><em>{match.home.score ?? "–"}</em></div></div><div className="premium-match-card__meta"><span>{match.period && match.clock ? `${match.period} · ${match.clock}` : match.date ? new Date(match.date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Time unavailable"}</span>{match.venue && <span>{match.venue}</span>}</div></article>)}</div>}</section><section className="premium-api-board"><div className="premium-api-board__heading"><div><span className="eyebrow eyebrow--red">FIVE CURATED PREMIUM APPS</span><h2>Useful tools, rebuilt for Premium.</h2><p>These are focused products, not endpoint cards. Choose an app, provide one clear input, and review the exact result returned by the service.</p></div><span className="premium-api-board__count">{PREMIUM_APPS.length} APPS</span></div><div className="premium-api-tabs">{PREMIUM_APPS.map((app) => <button key={app.id} className={premiumApp.id === app.id ? "is-active" : ""} onClick={() => { setPremiumApp(app); setPremiumAppInput(""); setPremiumAppResult(null); setPremiumAppError(""); }}>{app.name}</button>)}</div><div className="premium-api-workspace"><div className="premium-api-workspace__copy"><span className="eyebrow eyebrow--red">{premiumApp.eyebrow}</span><h3>{premiumApp.name}</h3><p>{premiumApp.description}</p></div><form className="premium-boost-form" onSubmit={runPremiumApp}><label>{premiumApp.field === "url" ? "Source URL" : "App name"}<input value={premiumAppInput} onChange={(event) => setPremiumAppInput(event.target.value)} placeholder={premiumApp.placeholder} inputMode={premiumApp.field === "url" ? "url" : "text"} /></label><button className="red-button premium-boost-submit" type="submit" disabled={premiumAppLoading}>{premiumAppLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{premiumAppLoading ? "Working…" : premiumApp.action}</button></form>{premiumAppLoading && <div className="premium-download-progress" aria-live="polite"><div className="premium-download-progress__heading"><span><RefreshCw size={15} className="spin" />{premiumAppStage}</span><strong>{premiumAppProgress}%</strong></div><div className="premium-download-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={premiumAppProgress} aria-label="Downloader progress"><span style={{ width: `${premiumAppProgress}%` }} /></div><p>We are fetching the response and preparing the direct file. The API endpoint will not be offered as the download.</p></div>}{premiumAppError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{premiumAppError}</span></div>}{premiumAppResult !== null && <div className="premium-boost-result premium-boost-result--notice"><strong>{findReturnedMediaLinks(premiumAppResult).length > 0 ? "Exact file returned" : "No direct file supplied"}</strong>{findReturnedMediaLinks(premiumAppResult).map((link) => (/\\.(mp3|wav|m4a|ogg|opus)(?:$|[?#])/i.test(link) && premiumApp.id !== "facebook-download" && premiumApp.id !== "tiktok-download" && premiumApp.id !== "youtube-download") ? <div className="premium-returned-media" key={link}><audio controls preload="metadata" src={link} /><div className="premium-file-actions"><button className="tool-download" type="button" onClick={() => downloadReturnedFile(link)} disabled={fileDownloadState[link] === "downloading"}><Download size={13} />{fileDownloadState[link] === "downloading" ? "Downloading…" : fileDownloadState[link] === "success" ? "Downloaded" : fileDownloadState[link] === "error" ? "Retry download" : "Download exact file"}</button></div></div> : <div className="premium-returned-media" key={link}><video controls playsInline preload="metadata" src={link} /><div className="premium-file-actions"><button className="tool-download" type="button" onClick={() => downloadReturnedFile(link)} disabled={fileDownloadState[link] === "downloading"}><Download size={13} />{fileDownloadState[link] === "downloading" ? "Downloading…" : fileDownloadState[link] === "success" ? "Downloaded" : fileDownloadState[link] === "error" ? "Retry download" : "Download exact file"}</button></div></div>)}{findReturnedMediaLinks(premiumAppResult).length === 0 && <p>No downloadable media URL was supplied by the provider. The API response is retained below for troubleshooting only.</p>}<pre>{JSON.stringify(premiumAppResult, null, 2)}</pre></div>}</div></section><section className="premium-app-launcher"><div className="premium-app-launcher__intro"><span className="eyebrow eyebrow--red">ELIMINATOR PREMIUM APPS</span><h2>Your private toolkit, curated.</h2><p>Choose a focused workspace below. Premium turns individual APIs into guided products with clear inputs, richer results, and mobile-ready actions.</p></div><div className="premium-app-grid"><button className="premium-app-tile premium-app-tile--video" onClick={() => document.getElementById("premium-video-lounge")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Play size={20} /></span><strong>Video Lounge</strong><small>Premium media workspace</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--growth" onClick={() => document.getElementById("premium-tiktok-boost")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Zap size={20} /></span><strong>Growth Desk</strong><small>TikTok + YouTube tools</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--music" onClick={() => document.getElementById("premium-toolkit")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Sparkles size={20} /></span><strong>Creator Desk</strong><small>Image, music, and creative apps</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--vault" onClick={() => document.getElementById("premium-apk-vault")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><LockKeyhole size={20} /></span><strong>APK Vault</strong><small>Curated app downloads</small><b>OPEN APP →</b></button></div></section><section id="premium-video-lounge" className="premium-room-card premium-room-card--active premium-room-card--workspace"><div className="premium-room-card__badge-row"><span className="premium-room-icon"><Play size={24} /></span><PremiumBadge state="active" /></div><span className="eyebrow eyebrow--red">PREMIUM VIDEO LOUNGE</span><h1>Premium media<br /><i>workspace ready.</i></h1><p>Welcome, {user.user_metadata?.full_name || user.email?.split("@")[0] || "member"}. The Premium media workspace is ready for the dedicated video service you will provide later.</p><div className="premium-benefits"><span><Check size={16} /> Premium account status confirmed</span><span><Check size={16} /> Dedicated media area reserved</span><span><Check size={16} /> No video source is loaded yet</span></div></section><section id="premium-tiktok-boost" className="premium-tool-card">
        <div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / SOCIAL BOOST</span><h2>TikTok Boost</h2></div><Zap size={22} /></div>
        <p className="premium-tool-card__lead">Send a TikTok video or profile target to the connected service. If it returns a job/status URL, Eliminator follows that job and shows the provider’s terminal result instead of treating the first JSON response as completion. Use this only for accounts and content you own or are authorized to manage, and follow TikTok’s rules.</p>
        <form className="premium-boost-form" onSubmit={submitBoost}>
          <label>Target URL or username<input value={boostTarget} onChange={(event) => setBoostTarget(event.target.value)} placeholder={boostType === "followers" ? "@username or TikTok profile URL" : "https://www.tiktok.com/@name/video/123..."} inputMode="url" /></label>
          <label>Service<select value={boostType} onChange={(event) => setBoostType(event.target.value as TikTokBoostType)}><option value="video_views">Video views</option><option value="like">Likes</option><option value="followers">Followers</option></select></label>
          <button className="red-button premium-boost-submit" type="submit" disabled={boostLoading}>{boostLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{boostLoading ? "Checking service…" : "Run TikTok Boost"}</button>
        </form>
        {boostError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{boostError}</span></div>}
        {boostLoading && <div className="premium-boost-status premium-boost-status--loading"><span className="premium-boost-status__icon"><RefreshCw size={15} className="spin" /></span><div><strong>Submitting TikTok boost…</strong><p>Connecting to the provider and waiting for a real response.</p></div></div>}
        {boostResult && <div className={boostResultClass(boostResult)}><div><strong>{boostOutcomeLabel(boostResult)}</strong><p>{String(boostResult.message || (boostResult.success === true ? "The provider confirmed completion." : "The provider has not confirmed completion yet."))}</p></div><pre>{JSON.stringify(boostResult, null, 2)}</pre></div>}
      </section>
      <section id="premium-youtube-studio" className="premium-tool-card premium-tool-card--youtube"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / SOCIAL BOOST</span><h2>YouTube View Booster</h2></div><Zap size={22} /></div><p className="premium-tool-card__lead">Submit a YouTube video or channel target to the connected service. Eliminator follows any returned job/status URL and labels the result accurately: confirmed completion, failure, or still pending. A first acceptance response alone is not treated as a completed metric boost.</p><form className="premium-boost-form" onSubmit={submitYouTubeBoost}><label>Target URL<input value={youtubeTarget} onChange={(event) => setYoutubeTarget(event.target.value)} placeholder={youtubeType === "subscribers" ? "https://www.youtube.com/@channel" : "https://www.youtube.com/watch?v=..."} inputMode="url" /></label><label>Service<select value={youtubeType} onChange={(event) => setYoutubeType(event.target.value as YouTubeBoostType)}><option value="views">Video views</option><option value="likes">Likes</option><option value="subscribers">Subscribers</option></select></label><button className="red-button premium-boost-submit" type="submit" disabled={youtubeLoading}>{youtubeLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{youtubeLoading ? "Checking service…" : "Run YouTube Boost"}</button></form>{youtubeError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{youtubeError}</span></div>}{youtubeLoading && <div className="premium-boost-status premium-boost-status--loading"><span className="premium-boost-status__icon"><RefreshCw size={15} className="spin" /></span><div><strong>Submitting YouTube boost…</strong><p>Connecting to the provider and waiting for a real response.</p></div></div>}{youtubeResult && <div className={boostResultClass(youtubeResult)}><div><strong>{boostOutcomeLabel(youtubeResult)}</strong><p>{String(youtubeResult.message || (youtubeResult.success === true ? "The provider confirmed completion." : "The provider has not confirmed completion yet."))}</p>{youtubeResult.amount !== undefined && <small>Reported amount: {String(youtubeResult.amount)} · Type: {String(youtubeResult.type || youtubeType)}</small>}</div><pre>{JSON.stringify(youtubeResult, null, 2)}</pre></div>}</section>      <section id="premium-mureka-studio" className="premium-tool-card premium-tool-card--mureka"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM CREATOR DESK / SUNO</span><h2>Mureka Music Studio</h2></div><Sparkles size={22} /></div><p className="premium-tool-card__lead">Turn a simple idea into a complete vocal or instrumental track. Shape the title, sound, lyrics, and mood here, then play the full returned file and save it directly to your phone.</p><form className="premium-boost-form premium-mureka-form" onSubmit={generateMurekaTrack}><label>Music brief<textarea value={murekaPrompt} onChange={(event) => setMurekaPrompt(event.target.value)} placeholder="Afrobeat love song about finding hope after a hard season…" rows={3} required /></label><div className="premium-mureka-grid"><label>Track title<input value={murekaTitle} onChange={(event) => setMurekaTitle(event.target.value)} placeholder="Midnight Signal" /></label><label>Style and mood<input value={murekaStyle} onChange={(event) => setMurekaStyle(event.target.value)} placeholder="Afrobeats, warm guitar, uplifting" /></label></div><label>Custom lyrics <span className="premium-field-note">optional</span><textarea value={murekaLyrics} onChange={(event) => setMurekaLyrics(event.target.value)} placeholder="Leave empty for Mureka to write lyrics, or paste your own structure…" rows={5} /></label><label className="premium-mureka-toggle"><input type="checkbox" checked={murekaInstrumental} onChange={(event) => setMurekaInstrumental(event.target.checked)} /><span><strong>Instrumental mode</strong><small>Generate the track without vocals.</small></span></label><button className="red-button premium-boost-submit" type="submit" disabled={murekaLoading || murekaPrompt.trim().length < 3}>{murekaLoading ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}{murekaLoading ? "Creating your full track…" : "Generate with Mureka"}</button></form>{murekaLoading && <div className="premium-mureka-progress" aria-live="polite"><div className="premium-mureka-progress__top"><span>{murekaStage}</span><strong>{murekaProgress}%</strong></div><div className="premium-mureka-progress__track"><span style={{ width: `${murekaProgress}%` }} /></div><small>Mureka is rendering the music. Keep this room open while the complete audio file is prepared.</small></div>}{murekaError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{murekaError}</span></div>}{murekaTracks.length > 0 && <div className="premium-mureka-results"><div className="premium-mureka-results__heading"><div><span className="eyebrow eyebrow--blue">FULL TRACKS READY</span><h3>Play or save your Mureka music</h3></div><Check size={22} /></div>{murekaTracks.map((track, index) => <div className="premium-mureka-track" key={track}><div className="premium-mureka-track__meta"><span>TRACK {index + 1}</span><strong>{murekaTitle.trim() || `Eliminator Mureka track ${index + 1}`}</strong></div><audio controls preload="metadata" src={track} aria-label={`Mureka track ${index + 1}`} /><button className="red-button" type="button" onClick={() => downloadMurekaTrack(track, index + 1)} disabled={murekaDownloadState[track] === "downloading"}>{murekaDownloadState[track] === "downloading" ? <RefreshCw size={16} className="spin" /> : <Download size={16} />}{murekaDownloadState[track] === "downloading" ? "Preparing download…" : murekaDownloadState[track] === "success" ? "Downloaded" : murekaDownloadState[track] === "error" ? "Retry download" : "Download full music"}</button></div>)}</div>}{Boolean(murekaRawResult) && murekaTracks.length === 0 && !murekaLoading && <details className="apk-result-card__details"><summary>View technical response</summary><pre>{JSON.stringify(murekaRawResult, null, 2)}</pre></details>}</section>
      <section id="premium-apk-vault" className="premium-tool-card premium-tool-card--apk"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / APP UTILITY</span><h2>APK App Downloader</h2></div><Zap size={22} /></div><p className="premium-tool-card__lead">Search the connected APK catalog by app name, review the returned package details, and download the exact APK link returned by the service. Always verify the source, package, permissions, and device compatibility before installing.</p><form className="premium-boost-form" onSubmit={submitApkSearch}><label>App name<input value={apkSearch} onChange={(event) => setApkSearch(event.target.value)} placeholder="WhatsApp, Telegram, Spotify…" autoCapitalize="words" /></label><button className="red-button premium-boost-submit" type="submit" disabled={apkLoading}>{apkLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{apkLoading ? "Searching APK catalog…" : "Find APK"}</button></form>{apkError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{apkError}</span></div>}{apkResult && <div className="apk-result-card">{apkResult.apk?.icon ? <img src={apkResult.apk.icon} alt={`${apkResult.apk.name || apkResult.query || "App"} icon`} className="apk-result-card__icon" /> : <div className="apk-result-card__icon apk-result-card__icon--fallback" aria-hidden="true"><LockKeyhole size={22} /></div>}<div className="apk-result-card__identity"><strong>{apkResult.apk?.name || apkResult.query || "App search result"}</strong><span>{apkResult.apk?.package || "Official store listing"}</span><small>{apkResult.apk?.developer ? `By ${apkResult.apk.developer}` : apkResult.apk?.lastUpdated ? `Catalog update: ${apkResult.apk.lastUpdated}` : "Choose the official store you trust to install this app."}</small></div><div className="apk-result-card__meta"><span className="apk-rating" aria-label={apkResult.apk?.rating ? `Rating ${apkResult.apk.rating} out of 5` : "Rating unavailable"}>★ {apkResult.apk?.rating !== undefined && apkResult.apk?.rating !== "" ? String(apkResult.apk.rating) : "Not rated"}</span><p>{apkResult.apk?.description || apkResult.apk?.summary || "No description was supplied by the catalog. Open an official store to review the current listing details."}</p></div>{apkResult.stores && <div className="apk-store-actions"><a className="red-button apk-download-button" href={apkResult.stores.googlePlay} target="_blank" rel="noreferrer">Open Google Play <ArrowLeft size={16} className="rotate-180" /></a><a className="tool-download" href={apkResult.stores.palmstore} target="_blank" rel="noreferrer">Open Palmstore <ArrowLeft size={16} className="rotate-180" /></a></div>}{apkResult.apk?.downloadLink && <a className="tool-download" href={apkResult.apk.downloadLink} target="_blank" rel="noreferrer">Provider package link <ArrowLeft size={16} className="rotate-180" /></a>}<details className="apk-result-card__details"><summary>View exact API response</summary><pre>{JSON.stringify(apkResult, null, 2)}</pre></details></div>}<p className="apk-safety-note"><LockKeyhole size={14} /> Official store links open the store listing. Eliminator does not bypass store protections or certify third-party APK safety.</p></section><section id="premium-toolkit" className="premium-tool-card premium-tool-card--future"><span className="eyebrow">PREMIUM TOOLKIT</span><h2>More premium functions coming here.</h2><p>This room is ready for additional approved API workspaces without changing the protected layout.</p></section>
    </>
  );

  return <div className="premium-room-shell"><header className="profile-topbar"><a className="brand" href="#premium" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>premium</em></span></a><div className="profile-topbar__actions"><PremiumBadge state={isPremium ? "active" : "inactive"} compact /><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header><main className="premium-room-layout">{isPremium ? activeContent : <section className="premium-room-card"><span className="premium-room-icon premium-room-icon--locked"><LockKeyhole size={24} /></span><PremiumBadge state="inactive" /><span className="eyebrow eyebrow--red">PREMIUM ACCESS REQUIRED</span><h1>This room is<br /><i>locked for now.</i></h1><p>Your account has not been activated by an approved administrator yet. Contact the Eliminator team on WhatsApp, then return after your Customer ID has been verified.</p><button className="red-button" onClick={onPricing}>Request Premium access <Sparkles size={16} /></button></section>}</main></div>;
}
