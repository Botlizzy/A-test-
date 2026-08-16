import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleAlert, Download, Image as ImageIcon, LogOut, Play, RefreshCw, Search, ShieldCheck, Sparkles, Trophy, UserRound, Volume2, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { fetchLiveScores, LIVE_SCORES_REFRESH_MS, type LiveMatch } from "@/lib/liveScores";
import { extractPremiumAiError, extractPremiumAiText, getPremiumAiUrl, PREMIUM_AI_MODELS, type PremiumAiModel } from "@/lib/premiumAi";
import { getImageGeneratorUrl, parseImageGeneratorResponse } from "@/lib/imageGenerators";

const HOMEPAGE_AI_MODELS = PREMIUM_AI_MODELS.filter((model) => ["gpt-4o", "claude-haiku-4.5", "gemini-3-pro", "deepseek-v4-flash", "grok-4.1-fast", "llama-4-maverick"].includes(model.id));
const XXL_SEARCH_ENDPOINT = "https://apis.davidcyril.name.ng/search/xnxx";
const VIDEO_FEED_ENDPOINT = "https://apis.davidcyril.name.ng/xvideo";

type HomeProps = { user: User; onProfile: () => void; onPricing: () => void; onPremium: () => void; onAdmin: () => void; onSignOut: () => Promise<void> };
const ADMIN_EMAILS = new Set(["mikeakex80@gmail.com", "elijahchinecheremonah@gmail.com"]);

type SearchItem = { title: string; url?: string; thumbnail?: string; duration?: string; views?: string };
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
export function extractSearchItems(payload: unknown): SearchItem[] {
  const found: SearchItem[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const row = value as Record<string, unknown>;
    const title = [row.title, row.name, row.caption].find((entry) => typeof entry === "string" && entry.trim()) as string | undefined;
    const url = [row.url, row.link, row.href, row.video_url, row.videoUrl].find((entry) => typeof entry === "string" && /^https?:\/\//i.test(entry)) as string | undefined;
    const thumbnail = [row.thumbnail, row.thumb, row.image, row.cover].find((entry) => typeof entry === "string" && /^https?:\/\//i.test(entry)) as string | undefined;
    if (title && (url || thumbnail)) found.push({ title: title.trim(), url, thumbnail, duration: typeof row.duration === "string" ? row.duration : undefined, views: typeof row.views === "string" || typeof row.views === "number" ? String(row.views) : undefined });
    Object.values(row).forEach((child) => { if (child && typeof child === "object") visit(child); });
  };
  visit(payload);
  const unique = new Map<string, SearchItem>();
  found.forEach((item) => { if (!unique.has(item.title)) unique.set(item.title, item); });
  return Array.from(unique.values()).slice(0, 12);
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
  const [aiModel, setAiModel] = useState<PremiumAiModel>(HOMEPAGE_AI_MODELS[0]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
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
    event.preventDefault(); const query = searchQuery.trim();
    if (query.length < 2 || searchLoading) return;
    setSearchLoading(true); setSearchError(""); setSearchResults([]);
    try { const url = new URL(XXL_SEARCH_ENDPOINT); url.searchParams.set("q", query); const response = await fetch(url, { headers: { Accept: "application/json" } }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(`XXL search returned HTTP ${response.status}.`); const items = extractSearchItems(payload); if (!items.length) throw new Error("No XXL results were returned for that search."); setSearchResults(items); } catch (cause) { setSearchError(cause instanceof Error ? cause.message : "XXL search could not complete."); } finally { setSearchLoading(false); }
  };

  const loadVideoFeed = async (event?: FormEvent) => {
    event?.preventDefault(); const sourceUrl = videoSourceUrl.trim();
    if (sourceUrl.length < 8 || videoLoading) return;
    setVideoLoading(true); setVideoError(""); setVideoItems([]);
    try { const url = new URL(VIDEO_FEED_ENDPOINT); url.searchParams.set("url", sourceUrl); const response = await fetch(url, { headers: { Accept: "application/json" } }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(`Video API returned HTTP ${response.status}.`); if (payload?.success === false) throw new Error(typeof payload.message === "string" ? payload.message : "The video provider rejected this URL."); const items = extractVideoItems(payload); if (!items.length) throw new Error("The API returned no direct playable file for this URL."); setVideoItems(items); setVideoIndex(0); } catch (cause) { setVideoItems([]); setVideoError(cause instanceof Error ? cause.message : "The video feed could not load right now."); } finally { setVideoLoading(false); }
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

  const accountLabel = useMemo(() => user.user_metadata?.full_name || user.email || "Account", [user]);
  const activeVideo = videoItems[videoIndex];
  return <div className="focused-homepage">
    <header className="focused-homepage__topbar"><a className="brand" href="#home" aria-label="Eliminator home"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>streaming</em></span></a><div className="focused-homepage__account"><span>{accountLabel}</span><button className="shortcut-button shortcut-button--profile" onClick={onProfile}><UserRound size={15} />Profile</button><button className="shortcut-button shortcut-button--premium" onClick={onPremium}><Sparkles size={15} />Premium Room</button>{ADMIN_EMAILS.has((user.email || "").toLowerCase()) && <button className="shortcut-button shortcut-button--admin" onClick={onAdmin}><ShieldCheck size={15} />Premium Admin</button>}<button className="shortcut-button shortcut-button--signout" onClick={onSignOut}><LogOut size={15} />Sign out</button></div></header>
    <main id="home" className="focused-homepage__main">
      <section className="focused-homepage__intro"><span className="eyebrow eyebrow--blue">ELIMINATOR HOME / FOUR ROOMS</span><h1>Watch, create,<br /><i>and ask.</i></h1><p>The public homepage is now limited to playable API media, XXL search, image generation, and six connected AI models.</p><div className="focused-homepage__quick-actions"><button className="red-button" onClick={() => document.getElementById("homepage-videos")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} />Watch video</button><button className="secondary-button" onClick={() => document.getElementById("homepage-ai")?.scrollIntoView({ behavior: "smooth" })}><Zap size={16} />AI tools</button></div></section>
      <section id="homepage-live-score" className="homepage-focus-card homepage-focus-card--score"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">FOOTBALL ONLY</span><h2>LiveScore board</h2><p>Live and scheduled football matches, refreshed automatically every minute.</p></div><button className="tool-download" type="button" onClick={() => void loadLiveScores()} disabled={liveLoading}>{liveLoading ? <RefreshCw size={15} className="spin" /> : <RefreshCw size={15} />}{liveLoading ? "Updating" : "Refresh"}</button></div>{liveLoading && <div className="homepage-loading"><RefreshCw size={18} className="spin" /><span>Fetching football scores…</span></div>}{liveError && <div className="homepage-error"><CircleAlert size={17} /><span>{liveError}</span><button onClick={() => void loadLiveScores()}>Try again</button></div>}{!liveLoading && !liveError && liveMatches.length === 0 && <div className="homepage-empty"><Trophy size={22} /><strong>No football matches found</strong><span>The board will update automatically when matches are available.</span></div>}{liveMatches.length > 0 && <div className="homepage-score-list">{liveMatches.map((match) => <MatchRow key={`${match.league}-${match.id}`} match={match} />)}</div>}</section>
      <section id="homepage-videos" className="homepage-focus-card homepage-focus-card--videos"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">XVIDEO API / PLAYABLE MEDIA</span><h2>Watch inside Eliminator</h2><p>Paste a supported video URL. The API returns a direct file for the native player, with sound enabled by default after your play tap.</p></div><Volume2 size={24} /></div><form className="homepage-search-form" onSubmit={loadVideoFeed}><input value={videoSourceUrl} onChange={(event) => setVideoSourceUrl(event.target.value)} placeholder="Paste a video URL from the provider…" aria-label="Video source URL" /><button className="red-button" type="submit" disabled={videoLoading || videoSourceUrl.trim().length < 8}>{videoLoading ? <><RefreshCw size={16} className="spin" />Preparing…</> : <><Play size={16} />Load video</>}</button></form>{videoLoading && <div className="homepage-loading"><RefreshCw size={18} className="spin" /><span>Fetching playable video files…</span></div>}{videoError && <div className="homepage-error"><CircleAlert size={17} /><span>{videoError}</span><button onClick={() => void loadVideoFeed()}>Try again</button></div>}{activeVideo && <div className="homepage-video-player"><video key={activeVideo.mediaUrl} controls playsInline preload="metadata" poster={activeVideo.thumbnail} muted={false} src={activeVideo.mediaUrl} onError={() => setVideoError("This returned media file could not be decoded by the browser.")} /><div className="homepage-video-player__meta"><div><strong>{activeVideo.title}</strong><span>{activeVideo.duration || "Direct API media"}</span></div><a className="secondary-button" href={activeVideo.mediaUrl} download target="_blank" rel="noreferrer"><Download size={15} />Download</a></div></div>}{videoItems.length > 1 && <div className="homepage-video-picker">{videoItems.map((item, index) => <button key={item.mediaUrl} className={index === videoIndex ? "is-active" : ""} onClick={() => setVideoIndex(index)}><Play size={13} />{item.title}</button>)}</div>}</section>
      <section id="homepage-xxl" className="homepage-focus-card homepage-focus-card--search"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">XXL DISCOVERY</span><h2>Search the catalog</h2><p>Search results stay in this page. Open a returned source only when you choose it.</p></div><Search size={24} /></div><form className="homepage-search-form" onSubmit={searchXXL}><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search XXL by title or keyword…" aria-label="Search XXL" /><button className="red-button" type="submit" disabled={searchLoading || searchQuery.trim().length < 2}>{searchLoading ? <><RefreshCw size={16} className="spin" />Searching…</> : <><Search size={16} />Search XXL</>}</button></form>{searchError && <div className="homepage-error"><CircleAlert size={17} /><span>{searchError}</span></div>}{searchLoading && <div className="homepage-loading"><RefreshCw size={18} className="spin" /><span>Preparing search results…</span></div>}{searchResults.length > 0 && <div className="homepage-search-results">{searchResults.map((item) => <article className="homepage-search-result" key={`${item.title}-${item.url}`}><div>{item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> : <span className="homepage-search-result__fallback"><Search size={18} /></span>}</div><section><h3>{item.title}</h3><p>{[item.duration, item.views].filter(Boolean).join(" · ") || "XXL result"}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open result</a>}</section></article>)}</div>}</section>
      <section id="homepage-image" className="homepage-focus-card homepage-focus-card--image"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">IMAGE GENERATOR / EPICREALISM</span><h2>Turn a prompt into an image</h2><p>Describe the subject, setting, colors, and mood. The returned image stays on this page and can be downloaded.</p></div><ImageIcon size={24} /></div><form className="homepage-ai-form" onSubmit={generateImage}><textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} rows={4} maxLength={1200} placeholder="A cinematic Lagos skyline at blue hour, red and blue light…" /><button className="red-button" type="submit" disabled={imageLoading || imagePrompt.trim().length < 3}>{imageLoading ? <><RefreshCw size={16} className="spin" />Generating…</> : <><ImageIcon size={16} />Generate image</>}</button></form>{imageError && <div className="homepage-error"><CircleAlert size={17} /><span>{imageError}</span></div>}{imageUrl && <div className="homepage-generated-image"><img src={imageUrl} alt={imagePrompt || "Generated image"} /><a className="red-button" href={imageUrl} download="eliminator-generated-image.png" target="_blank" rel="noreferrer"><Download size={16} />Save image</a></div>}</section>
      <section id="homepage-ai" className="homepage-focus-card homepage-focus-card--ai"><div className="homepage-focus-card__heading"><div><span className="eyebrow eyebrow--red">SIX AI ROOMS</span><h2>Ask the right model</h2><p>These six models are adapted from Premium Room and return readable answers instead of raw JSON.</p></div><Sparkles size={24} /></div><div className="homepage-ai-models">{HOMEPAGE_AI_MODELS.map((model) => <button key={model.id} className={aiModel.id === model.id ? "is-active" : ""} onClick={() => { setAiModel(model); setAiError(""); }}>{model.name}<small>{model.provider}</small></button>)}</div><div className="homepage-ai-selected"><strong>{aiModel.name}</strong><span>{aiModel.provider} · {aiModel.path}</span></div><form className="homepage-ai-form" onSubmit={sendAi}><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows={4} placeholder={`Ask ${aiModel.name} anything…`} /><button className="red-button" type="submit" disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? <><RefreshCw size={16} className="spin" />Thinking…</> : <><Sparkles size={16} />Send prompt</>}</button></form>{aiError && <div className="homepage-error"><CircleAlert size={17} /><span>{aiError}</span></div>}{aiReply && <article className="homepage-ai-reply"><span>{aiModel.name.toUpperCase()} REPLY</span><p>{aiReply}</p></article>}</section>
      <footer className="focused-homepage__footer"><ShieldCheck size={16} /><span>Premium Room remains protected and keeps the complete functional toolkit. The public homepage is intentionally limited to media, search, image generation, and six AI workspaces.</span><button className="text-button" onClick={onPremium}>Open Premium Room</button></footer>
    </main>
  </div>;
}
