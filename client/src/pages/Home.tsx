import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Copy, Download, Image as ImageIcon, LogOut, Play, RefreshCw, Search, ShieldCheck, Sparkles, Trophy, UserRound, Volume2, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { fetchLiveScores, LIVE_SCORES_REFRESH_MS, type LiveMatch } from "@/lib/liveScores";
import { extractPremiumAiError, extractPremiumAiText, getPremiumAiUrl, PREMIUM_AI_MODELS, type PremiumAiModel } from "@/lib/premiumAi";
import { getImageGeneratorUrl, parseImageGeneratorResponse } from "@/lib/imageGenerators";
import { copyText } from "@/lib/copyText";

const HOMEPAGE_AI_MODELS = PREMIUM_AI_MODELS.filter((model) => ["gpt-4o", "claude-haiku-4.5", "gemini-3-pro", "deepseek-v4-flash", "grok-4.1-fast", "llama-4-maverick"].includes(model.id));
const XXL_SEARCH_ENDPOINT = "https://apis.davidcyril.name.ng/xxx/xvideos";
const XXL_VIDEO_ENDPOINT = "https://apis.davidcyril.name.ng/xvideo";
const XXL_HAMSTER_RANDOM_ENDPOINT = "https://apis.davidcyril.name.ng/xhamster/random";
const VIDEO_FEED_ENDPOINT = "https://apis.davidcyril.name.ng/xvideo";

type HomeProps = { user: User; onProfile: () => void; onPricing: () => void; onPremium: () => void; onAdmin: () => void; onSignOut: () => Promise<void> };
const ADMIN_EMAILS = new Set(["mikeakex80@gmail.com", "elijahchinecheremonah@gmail.com"]);

type SearchItem = { title: string; url?: string; mediaUrl?: string; previewUrl?: string; thumbnail?: string; duration?: string; views?: string; source: "Xvideos Search" | "Xvideo Direct" | "xHamster Random"; sourceUrl?: string };
export function extractDirectMediaUrl(row: Record<string, unknown>): string | undefined {
  const preferredKeys = ["download_url", "downloadUrl", "videoUrl", "video_url", "mediaUrl", "media_url", "playback_url", "stream", "mp4", "m3u8"];
  for (const key of preferredKeys) {
    const candidate = row[key];
    if (typeof candidate === "string" && /^https?:\/\//i.test(candidate) && /\.(mp4|m3u8|webm|mov)(?:$|[?#])/i.test(candidate)) return candidate;
  }
  const isPlayable = (entry: unknown): entry is string => typeof entry === "string" && /^https?:\/\//i.test(entry) && /\.(mp4|m3u8|webm|mov)(?:$|[?#])/i.test(entry);
  const visit = (value: unknown): string | undefined => {
    if (isPlayable(value)) return value;
    if (Array.isArray(value)) { for (const child of value) { const found = visit(child); if (found) return found; } return undefined; }
    if (value && typeof value === "object") { for (const child of Object.values(value)) { const found = visit(child); if (found) return found; } }
    return undefined;
  };
  return visit(row);
}
type VideoItem = { title: string; mediaUrl: string; thumbnail?: string; duration?: string };
export function extractVideoItems(payload: unknown): VideoItem[] {
  const found: VideoItem[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const row = value as Record<string, unknown>;
    const title = [row.title, row.name, row.caption].find((entry) => typeof entry === "string" && entry.trim()) as string | undefined;
    const mediaUrl = [row.videoUrl, row.video_url, row.video, row.stream, row.mp4, row.m3u8, row.playback_url, row.download_url, row.url].find((entry) => typeof entry === "string" && /^https?:\/\//i.test(entry) && /\.(mp4|m3u8|webm|mov)(?:$|[?#])/i.test(entry)) as string | undefined;
    const thumbnail = [row.thumbnail, row.thumb, row.image, row.cover].find((entry) => typeof entry === "string" && /^https?:\/\//i.test(entry)) as string | undefined;
    if (mediaUrl) found.push({ title: title?.trim() || "Xvideo result", mediaUrl, thumbnail, duration: typeof row.duration === "string" ? row.duration : undefined });
    Object.values(row).forEach((child) => { if (child && typeof child === "object") visit(child); });
  };
  visit(payload);
  return Array.from(new Map(found.map((item) => [item.mediaUrl, item])).values()).slice(0, 8);
}
export function extractSearchItems(payload: unknown, source: SearchItem["source"] = "Xvideos Search"): SearchItem[] {
  const found: SearchItem[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const row = value as Record<string, unknown>;
    const title = [row.title, row.name, row.caption].find((entry) => typeof entry === "string" && entry.trim()) as string | undefined;
    const url = [row.url, row.link, row.href, row.video_url, row.videoUrl].find((entry) => typeof entry === "string" && /^https?:\/\//i.test(entry)) as string | undefined;
    const thumbnailCandidate = [row.thumbnail, row.thumb, row.image, row.cover].find((entry) => typeof entry === "string" && entry.trim()) as string | undefined;
    const thumbnail = thumbnailCandidate && /^https?:\/\//i.test(thumbnailCandidate) ? thumbnailCandidate : thumbnailCandidate && source === "xHamster Random" ? `https://xhamster.com/${thumbnailCandidate.replace(/^\/+/, "")}` : undefined;
    const previewUrl = row.thumbnail && typeof row.thumbnail === "object" ? extractDirectMediaUrl(row.thumbnail as Record<string, unknown>) : undefined;
    const mediaUrl = extractDirectMediaUrl(row);
    if (title && (url || thumbnail || mediaUrl || previewUrl)) found.push({ title: title.trim(), url, mediaUrl, previewUrl, thumbnail, duration: typeof row.duration === "string" ? row.duration : undefined, views: typeof row.views === "string" || typeof row.views === "number" ? String(row.views) : undefined, source, sourceUrl: url });
    Object.values(row).forEach((child) => { if (child && typeof child === "object") visit(child); });
  };
  visit(payload);
  const unique = new Map<string, SearchItem>();
  found.forEach((item) => { if (!unique.has(item.title)) unique.set(item.title, item); });
  return Array.from(unique.values());
}

function MatchRow({ match }: { match: LiveMatch }) {
  return <article className="homepage-match-row"><div className="homepage-match-row__league"><span>{match.leagueLabel}</span><b className={/progress|live|in progress/i.test(match.status) ? "is-live" : ""}>{match.status}</b></div><div className="homepage-match-row__teams"><div>{match.away.logo ? <img src={match.away.logo} alt="" /> : <span className="homepage-team-fallback">A</span>}<strong>{match.away.shortName || match.away.name}</strong><b>{match.away.score ?? "—"}</b></div><div>{match.home.logo ? <img src={match.home.logo} alt="" /> : <span className="homepage-team-fallback">H</span>}<strong>{match.home.shortName || match.home.name}</strong><b>{match.home.score ?? "—"}</b></div></div><small>{match.clock || match.period || match.date || "Scheduled"}</small></article>;
}

export default function Home({ user, onProfile, onPricing, onPremium, onAdmin, onSignOut }: HomeProps) {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedSearchVideo, setSelectedSearchVideo] = useState<SearchItem | null>(null);
  const [aiModel, setAiModel] = useState<PremiumAiModel>(HOMEPAGE_AI_MODELS[0]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiCopied, setAiCopied] = useState(false);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoSourceUrl, setVideoSourceUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  const loadLiveScores = async () => {
    setLiveLoading(true); setLiveError("");
    try { setLiveMatches(await fetchLiveScores()); } catch (cause) { setLiveMatches([]); setLiveError(cause instanceof Error ? cause.message : "LiveScore is temporarily unavailable."); } finally { setLiveLoading(false); }
  };
  useEffect(() => { void loadLiveScores(); const timer = window.setInterval(() => void loadLiveScores(), LIVE_SCORES_REFRESH_MS); return () => window.clearInterval(timer); }, []);

  const searchXXL = async (event: FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2 || searchLoading) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const xvideosUrl = new URL(XXL_SEARCH_ENDPOINT);
      xvideosUrl.searchParams.set("q", query);
      xvideosUrl.searchParams.set("page", "1");
      const [xvideosResult, hamsterResult] = await Promise.allSettled([
        fetch(xvideosUrl, { headers: { Accept: "application/json" } }).then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(`Xvideos Search returned HTTP ${response.status}.`);
          return extractSearchItems(payload, "Xvideos Search");
        }),
        fetch(XXL_HAMSTER_RANDOM_ENDPOINT, { headers: { Accept: "application/json" } }).then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(`xHamster Random returned HTTP ${response.status}.`);
          return extractSearchItems(payload, "xHamster Random");
        }),
      ]);
      const items = [
        ...(xvideosResult.status === "fulfilled" ? xvideosResult.value : []),
        ...(hamsterResult.status === "fulfilled" ? hamsterResult.value : []),
      ];
      const unique = Array.from(new Map(items.map((item) => [`${item.source}:${item.title}`, item])).values());
      if (!unique.length) throw new Error("The Xvideos Search and xHamster Random feeds returned no results right now.");
      setSearchResults(unique);
      if (xvideosResult.status === "rejected" && hamsterResult.status === "rejected") throw new Error("Both XXL sources are temporarily unavailable. Try again shortly.");
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "XXL search could not complete.");
    } finally {
      setSearchLoading(false);
    }
  };

  const playSearchItem = async (item: SearchItem) => {
    if (searchLoading) return;
    const sourceUrl = item.sourceUrl || item.url;
    if (item.mediaUrl && !sourceUrl) {
      setSelectedSearchVideo(item);
      return;
    }
    if (!sourceUrl) {
      setSearchError("This result has no source URL that can be resolved into a playable file.");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    try {
      const resolverUrl = new URL(XXL_VIDEO_ENDPOINT);
      resolverUrl.searchParams.set("url", sourceUrl);
      const response = await fetch(resolverUrl, { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`Xvideo resolver returned HTTP ${response.status}.`);
      const mediaUrl = extractDirectMediaUrl(payload as Record<string, unknown>);
      if (!mediaUrl) throw new Error("The selected provider returned metadata but no direct playable file.");
      setSelectedSearchVideo({ ...item, mediaUrl });
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "The selected video could not be prepared for in-page playback.");
    } finally {
      setSearchLoading(false);
    }
  };

  const loadVideoFeed = async (event?: FormEvent) => {
    event?.preventDefault(); const sourceUrl = videoSourceUrl.trim();
    if (sourceUrl.length < 8 || videoLoading) return;
    setVideoLoading(true); setVideoError(""); setVideoItems([]);
    try { const url = new URL(VIDEO_FEED_ENDPOINT); url.searchParams.set("url", sourceUrl); const response = await fetch(url, { headers: { Accept: "application/json" } }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(`Video API returned HTTP ${response.status}.`); if (payload?.success === false) throw new Error(typeof payload.message === "string" ? payload.message : "The video provider rejected this URL."); const items = extractVideoItems(payload); if (!items.length) throw new Error(/google\.com\/url|google\.com/i.test(sourceUrl) ? "This is a Google redirect URL, not a direct supported video URL. Paste the original video page URL from the provider." : "The API returned no direct playable file for this URL. Paste a supported source URL and try again."); setVideoItems(items); setVideoIndex(0); } catch (cause) { setVideoItems([]); setVideoError(cause instanceof Error ? cause.message : "The video feed could not load right now."); } finally { setVideoLoading(false); }
  };

  const generateImage = async (event: FormEvent) => {
    event.preventDefault(); const prompt = imagePrompt.trim(); if (prompt.length < 3 || imageLoading) return;
    setImageLoading(true); setImageError(""); setImageUrl("");
    try { const response = await fetch(getImageGeneratorUrl("epicrealism", prompt, "1:1")); const result = await parseImageGeneratorResponse(response); setImageUrl(result.url); } catch (cause) { setImageError(cause instanceof Error ? cause.message : "Image generation failed."); } finally { setImageLoading(false); }
  };

  const sendAi = async (event: FormEvent) => {
    event.preventDefault(); const prompt = aiPrompt.trim(); if (!prompt || aiLoading) return;
    setAiLoading(true); setAiError(""); setAiReply("");
    try { const response = await fetch(getPremiumAiUrl(aiModel, prompt), { headers: { Accept: "application/json" } }); const payload = await response.json().catch(() => ({})); const text = extractPremiumAiText(payload); if (!response.ok || !text) throw new Error(extractPremiumAiError(payload) || `The selected AI returned no readable reply (${response.status}).`); setAiReply(text); setAiPrompt(""); } catch (cause) { setAiError(cause instanceof Error ? cause.message : "The selected AI could not reply right now."); } finally { setAiLoading(false); }
  };

  const copyAiReply = async () => {
    if (!aiReply) return;
    const copied = await copyText(aiReply);
    setAiCopied(copied);
    window.setTimeout(() => setAiCopied(false), 1800);
  };

  const accountLabel = useMemo(() => user.user_metadata?.full_name || user.email || "Account", [user]);
  const activeVideo = videoItems[videoIndex];
  return <div className="focused-homepage">
    <header className="focused-homepage__topbar"><a className="brand" href="#home" aria-label="Eliminator home"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>streaming</em></span></a><div className="focused-homepage__account"><span>{accountLabel}</span><button className="shortcut-button shortcut-button--profile" onClick={onProfile}><UserRound size={15} />Profile</button><button className="shortcut-button shortcut-button--premium" onClick={onPremium}><Sparkles size={15} />Premium Room</button><button className="shortcut-button shortcut-button--request" onClick={onPricing}><Sparkles size={15} />Request Premium</button>{ADMIN_EMAILS.has((user.email || "").toLowerCase()) && <button className="shortcut-button shortcut-button--admin" onClick={onAdmin}><ShieldCheck size={15} />Premium Admin</button>}<button className="shortcut-button shortcut-button--signout" onClick={onSignOut}><LogOut size={15} />Sign out</button></div></header>
    <main id="home" className="focused-homepage__main">
      <section className="focused-homepage__intro"><span className="eyebrow eyebrow--blue">ELIMINATOR HOME / FOUR ROOMS</span><h1>Watch, create,<br /><i>and ask.</i></h1><p>The public homepage is now limited to playable API media, XXL search, image generation, and six connected AI models.</p><div className="focused-homepage__quick-actions"><button className="red-button" onClick={() => document.getElementById("homepage-videos")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} />Watch video</button><button className="secondary-button" onClick={() => document.getElementById("homepage-ai")?.scrollIntoView({ behavior: "smooth" })}><Zap size={16} />AI tools</button></div></section>
      <section id="homepage-live-score" className="homepage-focus-card homepage-focus-card--score"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">FOOTBALL ONLY</span><h2>LiveScore board</h2><p>All live football matches returned by the aggregated sports feed, refreshed automatically every minute.</p></div><button className="tool-download" type="button" onClick={() => void loadLiveScores()} disabled={liveLoading}>{liveLoading ? <RefreshCw size={15} className="spin" /> : <RefreshCw size={15} />}{liveLoading ? "Updating" : "Refresh"}</button></div>{liveLoading && <div className="homepage-loading"><RefreshCw size={18} className="spin" /><span>Fetching football scores…</span></div>}{liveError && <div className="homepage-error"><CircleAlert size={17} /><span>{liveError}</span><button onClick={() => void loadLiveScores()}>Try again</button></div>}{!liveLoading && !liveError && liveMatches.length === 0 && <div className="homepage-empty"><Trophy size={22} /><strong>No live football matches found</strong><span>The board will update automatically when live matches are available.</span></div>}{liveMatches.length > 0 && <div className="homepage-score-list">{liveMatches.map((match) => <MatchRow key={`${match.league}-${match.id}`} match={match} />)}</div>}</section>
      <section id="homepage-videos" className="homepage-focus-card homepage-focus-card--videos"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">XVIDEO API / PLAYABLE MEDIA</span><h2>Watch inside Eliminator</h2><p>Paste a supported video URL. The API returns a direct file for the native player, with sound enabled by default after your play tap.</p></div><Volume2 size={24} /></div><form className="homepage-search-form" onSubmit={loadVideoFeed}><input value={videoSourceUrl} onChange={(event) => setVideoSourceUrl(event.target.value)} placeholder="Paste a video URL from the provider…" aria-label="Video source URL" /><button className="red-button" type="submit" disabled={videoLoading || videoSourceUrl.trim().length < 8}>{videoLoading ? <><RefreshCw size={16} className="spin" />Preparing…</> : <><Play size={16} />Load video</>}</button></form>{videoLoading && <div className="homepage-loading"><RefreshCw size={18} className="spin" /><span>Fetching playable video files…</span></div>}{videoError && <div className="homepage-error"><CircleAlert size={17} /><span>{videoError}</span><button onClick={() => void loadVideoFeed()}>Try again</button></div>}{activeVideo && <div className="homepage-video-player"><video key={activeVideo.mediaUrl} controls playsInline preload="metadata" poster={activeVideo.thumbnail} muted={false} src={activeVideo.mediaUrl} onError={() => setVideoError("This returned media file could not be decoded by the browser.")} /><div className="homepage-video-player__meta"><div><strong>{activeVideo.title}</strong><span>{activeVideo.duration || "Direct API media"}</span></div><a className="secondary-button" href={activeVideo.mediaUrl} download target="_blank" rel="noreferrer"><Download size={15} />Download</a></div></div>}{videoItems.length > 1 && <div className="homepage-video-picker">{videoItems.map((item, index) => <button key={item.mediaUrl} className={index === videoIndex ? "is-active" : ""} onClick={() => setVideoIndex(index)}><Play size={13} />{item.title}</button>)}</div>}</section>
      <section id="homepage-xxl" className="homepage-focus-card homepage-focus-card--search"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">XXL DISCOVERY</span><h2>Search the catalog</h2><p>Xvideos Search and xHamster Random results stay on this page. Selecting a result resolves its full direct file first, then opens it in the native player above the list.</p></div><Search size={24} /></div><form className="homepage-search-form" onSubmit={searchXXL}><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search XXL by title or keyword…" aria-label="Search XXL" /><button className="red-button" type="submit" disabled={searchLoading || searchQuery.trim().length < 2}>{searchLoading ? <><RefreshCw size={16} className="spin" />Searching…</> : <><Search size={16} />Search XXL</>}</button></form>{searchError && <div className="homepage-error"><CircleAlert size={17} /><span>{searchError}</span></div>}{searchLoading && <div className="homepage-loading"><RefreshCw size={18} className="spin" /><span>Preparing search results…</span></div>}{selectedSearchVideo?.mediaUrl && <div className="homepage-search-player homepage-search-player--top"><div className="homepage-video-player"><video key={selectedSearchVideo.mediaUrl} controls playsInline preload="metadata" poster={selectedSearchVideo.thumbnail} muted={false} src={selectedSearchVideo.mediaUrl} onError={() => setSearchError("This XXL result returned a file the browser could not decode.")} /><div className="homepage-video-player__meta"><div><strong>{selectedSearchVideo.title}</strong><span>{selectedSearchVideo.duration || "Full direct API media"}</span></div><button className="secondary-button" type="button" onClick={() => setSelectedSearchVideo(null)}>Close player</button></div></div></div>}{searchResults.length > 0 && <div className="homepage-search-results">{searchResults.map((item) => <article className="homepage-search-result" key={`${item.source}-${item.title}-${item.url || item.mediaUrl}`}><div>{item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> : <span className="homepage-search-result__fallback"><Search size={18} /></span>}</div><section><h3>{item.title}</h3><p>{[item.duration, item.views].filter(Boolean).join(" · ") || "XXL result"}</p><small className="homepage-search-result__source">{item.source}</small><button className="secondary-button" type="button" disabled={searchLoading || (!item.mediaUrl && !item.url && !item.sourceUrl)} onClick={() => void playSearchItem(item)}><Play size={14} />{item.mediaUrl && !item.url ? "Play full file" : "Get full video"}</button>{!item.mediaUrl && <span className="homepage-search-result__unavailable">The short preview is not used for playback; the Xvideo resolver will fetch the full direct file first.</span>}</section></article>)}</div>}</section>
      <section id="homepage-image" className="homepage-focus-card homepage-focus-card--image"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">IMAGE GENERATOR / EPICREALISM</span><h2>Turn a prompt into an image</h2><p>Describe the subject, setting, colors, and mood. The returned image stays on this page and can be downloaded.</p></div><ImageIcon size={24} /></div><form className="homepage-ai-form" onSubmit={generateImage}><textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} rows={4} maxLength={1200} placeholder="A cinematic Lagos skyline at blue hour, red and blue light…" /><button className="red-button" type="submit" disabled={imageLoading || imagePrompt.trim().length < 3}>{imageLoading ? <><RefreshCw size={16} className="spin" />Generating…</> : <><ImageIcon size={16} />Generate image</>}</button></form>{imageError && <div className="homepage-error"><CircleAlert size={17} /><span>{imageError}</span></div>}{imageUrl && <div className="homepage-generated-image"><img src={imageUrl} alt={imagePrompt || "Generated image"} /><a className="red-button" href={imageUrl} download="eliminator-generated-image.png" target="_blank" rel="noreferrer"><Download size={16} />Save image</a></div>}</section>
      <section id="homepage-ai" className="homepage-focus-card homepage-focus-card--ai"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">SIX AI ROOMS</span><h2>Ask the right model</h2><p>These six models are adapted from Premium Room and return readable answers instead of raw JSON.</p></div><Sparkles size={24} /></div><div className="homepage-ai-models">{HOMEPAGE_AI_MODELS.map((model) => <button key={model.id} className={aiModel.id === model.id ? "is-active" : ""} onClick={() => { setAiModel(model); setAiError(""); }}>{model.name}<small>{model.provider}</small></button>)}</div><div className="homepage-ai-selected"><strong>{aiModel.name}</strong><span>{aiModel.provider} · {aiModel.path}</span></div><form className="homepage-ai-form" onSubmit={sendAi}><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows={4} placeholder={`Ask ${aiModel.name} anything…`} /><button className="red-button" type="submit" disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? <><RefreshCw size={16} className="spin" />Thinking…</> : <><Sparkles size={16} />Send prompt</>}</button></form>{aiError && <div className="homepage-error"><CircleAlert size={17} /><span>{aiError}</span></div>}{aiReply && <article className="homepage-ai-reply"><div className="homepage-ai-reply__heading"><span>{aiModel.name.toUpperCase()} REPLY</span><button className="tool-download" type="button" onClick={() => void copyAiReply()} aria-label="Copy generated AI answer">{aiCopied ? <Check size={14} /> : <Copy size={14} />}{aiCopied ? "Copied" : "Copy answer"}</button></div><p>{aiReply}</p>{!aiCopied && <small>Copy this answer to your clipboard</small>}</article>}</section>
      <footer className="focused-homepage__footer"><ShieldCheck size={16} /><span>Premium Room remains protected and keeps the complete functional toolkit. The public homepage is intentionally limited to media, search, image generation, and six AI workspaces.</span><button className="text-button" onClick={onPremium}>Open Premium Room</button></footer>
    </main>
  </div>;
}
