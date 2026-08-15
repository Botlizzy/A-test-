import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, CircleAlert, Download, LockKeyhole, LogOut, Play, RefreshCw, Sparkles, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import PremiumBadge from "@/components/PremiumBadge";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";
import { getTikTokBoostUrl, isTikTokTarget, type TikTokBoostType } from "@/lib/tiktokBoost";
import { getYouTubeBoostUrl, isYouTubeTarget, type YouTubeBoostType } from "@/lib/youtubeBoost";
import { getApkDownloaderUrl, isApkSearch, type ApkResult } from "@/lib/apkDownloader";
import { extractPremiumAiText, getPremiumAiUrl, PREMIUM_AI_MODELS, type PremiumAiModel } from "@/lib/premiumAi";

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

export function findReturnedMediaLinks(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown, keyHint = "") => {
    if (typeof node === "string") {
      const urls = node.match(/https?:\/\/[^\s"'\\]+/g) || [];
      urls.forEach((raw) => {
        const url = raw.replace(/[),.;]+$/, "");
        if (!url.includes("apis.davidcyril.name.ng") && (/\.(mp4|webm|mov|m4v|mp3|wav|m4a|ogg)(?:$|[?#])/i.test(url) || /download|media|video|audio|stream|source|url|link/i.test(keyHint))) found.push(url);
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
  const [premiumAppResult, setPremiumAppResult] = useState<unknown>(null);
  const [fileDownloadState, setFileDownloadState] = useState<Record<string, "idle" | "downloading" | "success" | "error">>({});
  const [premiumAppError, setPremiumAppError] = useState("");
  const [aiModel, setAiModel] = useState<PremiumAiModel>(PREMIUM_AI_MODELS[0]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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
      const response = await fetch(getApkDownloaderUrl(apkSearch), { headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => ({ status: false }))) as ApkResult;
      setApkResult(payload);
      if (!response.ok || payload.status !== true) setApkError("The APK service did not return a successful result.");
    } catch (cause) {
      setApkError(cause instanceof Error ? cause.message : "The APK service is unavailable.");
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
    try {
      const target = new URL(`https://apis.davidcyril.name.ng${premiumApp.path}`);
      target.searchParams.set(premiumApp.field, premiumAppInput.trim());
      const response = await fetch(target.toString(), { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || `Service returned HTTP ${response.status}.`);
      setPremiumAppResult(payload);
    } catch (cause) {
      setPremiumAppError(cause instanceof Error ? cause.message : "The Premium app could not complete the request.");
    } finally {
      setPremiumAppLoading(false);
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

  const activeContent = (
    <>
      <section className="premium-ai-chat"><div className="premium-ai-chat__heading"><div><span className="eyebrow eyebrow--red">PREMIUM AI CHAT</span><h2>Talk to the model, not the JSON.</h2><p>Choose an AI from the curated catalog, write a prompt, and continue the conversation with readable replies.</p></div><span className="premium-api-board__count">{PREMIUM_AI_MODELS.length} AIS</span></div><div className="premium-ai-models">{PREMIUM_AI_MODELS.map((model) => <button key={model.id} className={aiModel.id === model.id ? "is-active" : ""} onClick={() => { setAiModel(model); setAiError(""); }}>{model.name}<small>{model.provider}</small></button>)}</div><div className="premium-ai-thread">{aiMessages.length === 0 ? <div className="premium-ai-empty"><Sparkles size={22} /><strong>Start a private conversation</strong><span>Ask for an explanation, plan, rewrite, idea, or answer.</span></div> : aiMessages.map((message, index) => <div className={`premium-ai-message premium-ai-message--${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "user" ? "YOU" : aiModel.name.toUpperCase()}</span><p>{message.text}</p></div>)}{aiLoading && <div className="premium-ai-message premium-ai-message--assistant"><span>{aiModel.name.toUpperCase()}</span><p className="ai-thinking">Thinking…</p></div>}</div><form className="premium-ai-composer" onSubmit={sendAiMessage}><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder={`Message ${aiModel.name}…`} rows={3} /><button className="red-button" type="submit" disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}{aiLoading ? "Waiting for reply…" : "Send prompt"}</button></form>{aiError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{aiError}</span></div>}</section><section className="premium-api-board"><div className="premium-api-board__heading"><div><span className="eyebrow eyebrow--red">FIVE CURATED PREMIUM APPS</span><h2>Useful tools, rebuilt for Premium.</h2><p>These are focused products, not endpoint cards. Choose an app, provide one clear input, and review the exact result returned by the service.</p></div><span className="premium-api-board__count">{PREMIUM_APPS.length} APPS</span></div><div className="premium-api-tabs">{PREMIUM_APPS.map((app) => <button key={app.id} className={premiumApp.id === app.id ? "is-active" : ""} onClick={() => { setPremiumApp(app); setPremiumAppInput(""); setPremiumAppResult(null); setPremiumAppError(""); }}>{app.name}</button>)}</div><div className="premium-api-workspace"><div className="premium-api-workspace__copy"><span className="eyebrow eyebrow--red">{premiumApp.eyebrow}</span><h3>{premiumApp.name}</h3><p>{premiumApp.description}</p></div><form className="premium-boost-form" onSubmit={runPremiumApp}><label>{premiumApp.field === "url" ? "Source URL" : "App name"}<input value={premiumAppInput} onChange={(event) => setPremiumAppInput(event.target.value)} placeholder={premiumApp.placeholder} inputMode={premiumApp.field === "url" ? "url" : "text"} /></label><button className="red-button premium-boost-submit" type="submit" disabled={premiumAppLoading}>{premiumAppLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{premiumAppLoading ? "Working…" : premiumApp.action}</button></form>{premiumAppError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{premiumAppError}</span></div>}{premiumAppResult !== null && <div className="premium-boost-result premium-boost-result--notice"><strong>Exact service result</strong>{findReturnedMediaLinks(premiumAppResult).map((link) => /\\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(link) ? <div className="premium-returned-media" key={link}><video controls playsInline preload="metadata" src={link} /><div className="premium-file-actions"><a className="tool-download" href={link} target="_blank" rel="noreferrer">Open exact video file</a><button className="tool-download" type="button" onClick={() => downloadReturnedFile(link)} disabled={fileDownloadState[link] === "downloading"}><Download size={13} />{fileDownloadState[link] === "downloading" ? "Downloading…" : fileDownloadState[link] === "success" ? "Downloaded" : fileDownloadState[link] === "error" ? "Retry download" : "Download exact file"}</button></div></div> : <div className="premium-returned-media" key={link}><audio controls preload="metadata" src={link} /><div className="premium-file-actions"><a className="tool-download" href={link} target="_blank" rel="noreferrer">Open exact audio file</a><button className="tool-download" type="button" onClick={() => downloadReturnedFile(link)} disabled={fileDownloadState[link] === "downloading"}><Download size={13} />{fileDownloadState[link] === "downloading" ? "Downloading…" : fileDownloadState[link] === "success" ? "Downloaded" : fileDownloadState[link] === "error" ? "Retry download" : "Download exact file"}</button></div></div>)}<pre>{JSON.stringify(premiumAppResult, null, 2)}</pre></div>}</div></section><section className="premium-app-launcher"><div className="premium-app-launcher__intro"><span className="eyebrow eyebrow--red">ELIMINATOR PREMIUM APPS</span><h2>Your private toolkit, curated.</h2><p>Choose a focused workspace below. Premium turns individual APIs into guided products with clear inputs, richer results, and mobile-ready actions.</p></div><div className="premium-app-grid"><button className="premium-app-tile premium-app-tile--video" onClick={() => document.getElementById("premium-video-lounge")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Play size={20} /></span><strong>Video Lounge</strong><small>Premium media workspace</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--growth" onClick={() => document.getElementById("premium-tiktok-boost")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Zap size={20} /></span><strong>Growth Desk</strong><small>TikTok + YouTube tools</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--music" onClick={() => document.getElementById("premium-toolkit")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Sparkles size={20} /></span><strong>Creator Desk</strong><small>Music and new creative apps</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--vault" onClick={() => document.getElementById("premium-apk-vault")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><LockKeyhole size={20} /></span><strong>APK Vault</strong><small>Curated app downloads</small><b>OPEN APP →</b></button></div></section><section id="premium-video-lounge" className="premium-room-card premium-room-card--active premium-room-card--workspace"><div className="premium-room-card__badge-row"><span className="premium-room-icon"><Play size={24} /></span><PremiumBadge state="active" /></div><span className="eyebrow eyebrow--red">PREMIUM VIDEO LOUNGE</span><h1>Premium media<br /><i>workspace ready.</i></h1><p>Welcome, {user.user_metadata?.full_name || user.email?.split("@")[0] || "member"}. The Premium media workspace is ready for the dedicated video service you will provide later.</p><div className="premium-benefits"><span><Check size={16} /> Premium account status confirmed</span><span><Check size={16} /> Dedicated media area reserved</span><span><Check size={16} /> No video source is loaded yet</span></div></section><section id="premium-tiktok-boost" className="premium-tool-card">
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
      <section id="premium-youtube-studio" className="premium-tool-card premium-tool-card--youtube"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / SOCIAL BOOST</span><h2>YouTube View Booster</h2></div><Zap size={22} /></div><p className="premium-tool-card__lead">Submit a YouTube video or channel target to the connected service. Eliminator follows any returned job/status URL and labels the result accurately: confirmed completion, failure, or still pending. A first acceptance response alone is not treated as a completed metric boost.</p><form className="premium-boost-form" onSubmit={submitYouTubeBoost}><label>Target URL<input value={youtubeTarget} onChange={(event) => setYoutubeTarget(event.target.value)} placeholder={youtubeType === "subscribers" ? "https://www.youtube.com/@channel" : "https://www.youtube.com/watch?v=..."} inputMode="url" /></label><label>Service<select value={youtubeType} onChange={(event) => setYoutubeType(event.target.value as YouTubeBoostType)}><option value="views">Video views</option><option value="likes">Likes</option><option value="subscribers">Subscribers</option></select></label><button className="red-button premium-boost-submit" type="submit" disabled={youtubeLoading}>{youtubeLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{youtubeLoading ? "Checking service…" : "Run YouTube Boost"}</button></form>{youtubeError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{youtubeError}</span></div>}{youtubeLoading && <div className="premium-boost-status premium-boost-status--loading"><span className="premium-boost-status__icon"><RefreshCw size={15} className="spin" /></span><div><strong>Submitting YouTube boost…</strong><p>Connecting to the provider and waiting for a real response.</p></div></div>}{youtubeResult && <div className={boostResultClass(youtubeResult)}><div><strong>{boostOutcomeLabel(youtubeResult)}</strong><p>{String(youtubeResult.message || (youtubeResult.success === true ? "The provider confirmed completion." : "The provider has not confirmed completion yet."))}</p>{youtubeResult.amount !== undefined && <small>Reported amount: {String(youtubeResult.amount)} · Type: {String(youtubeResult.type || youtubeType)}</small>}</div><pre>{JSON.stringify(youtubeResult, null, 2)}</pre></div>}</section>      <section id="premium-apk-vault" className="premium-tool-card premium-tool-card--apk"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / APP UTILITY</span><h2>APK App Downloader</h2></div><Zap size={22} /></div><p className="premium-tool-card__lead">Search the connected APK catalog by app name, review the returned package details, and download the exact APK link returned by the service. Always verify the source, package, permissions, and device compatibility before installing.</p><form className="premium-boost-form" onSubmit={submitApkSearch}><label>App name<input value={apkSearch} onChange={(event) => setApkSearch(event.target.value)} placeholder="WhatsApp, Telegram, Spotify…" autoCapitalize="words" /></label><button className="red-button premium-boost-submit" type="submit" disabled={apkLoading}>{apkLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{apkLoading ? "Searching APK catalog…" : "Find APK"}</button></form>{apkError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{apkError}</span></div>}{apkResult?.apk && <div className="apk-result-card">{apkResult.apk.icon && <img src={apkResult.apk.icon} alt="" className="apk-result-card__icon" />}<div className="apk-result-card__identity"><strong>{apkResult.apk.name || "APK result"}</strong><span>{apkResult.apk.package || "Package not provided"}</span><small>Version / update: {apkResult.apk.lastUpdated || "Not provided"}</small></div>{apkResult.apk.downloadLink && <a className="red-button apk-download-button" href={apkResult.apk.downloadLink} target="_blank" rel="noreferrer">Download APK <ArrowLeft size={16} className="rotate-180" /></a>}<details className="apk-result-card__details"><summary>View exact API response</summary><pre>{JSON.stringify(apkResult, null, 2)}</pre></details></div>}<p className="apk-safety-note"><LockKeyhole size={14} /> Eliminator displays the API result; it does not scan or certify APK safety.</p></section><section id="premium-toolkit" className="premium-tool-card premium-tool-card--future"><span className="eyebrow">PREMIUM TOOLKIT</span><h2>More premium functions coming here.</h2><p>This room is ready for additional approved API workspaces without changing the protected layout.</p></section>
    </>
  );

  return <div className="premium-room-shell"><header className="profile-topbar"><a className="brand" href="#premium" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>premium</em></span></a><div className="profile-topbar__actions"><PremiumBadge state={isPremium ? "active" : "inactive"} compact /><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header><main className="premium-room-layout">{isPremium ? activeContent : <section className="premium-room-card"><span className="premium-room-icon premium-room-icon--locked"><LockKeyhole size={24} /></span><PremiumBadge state="inactive" /><span className="eyebrow eyebrow--red">PREMIUM ACCESS REQUIRED</span><h1>This room is<br /><i>locked for now.</i></h1><p>Your account has not been activated by an approved administrator yet. Contact the Eliminator team on WhatsApp, then return after your Customer ID has been verified.</p><button className="red-button" onClick={onPricing}>Request Premium access <Sparkles size={16} /></button></section>}</main></div>;
}
