/* Coastal Signal: editorial video discovery, Tide Blue actions, signal-led motion, playback-first hierarchy. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Volume2,
  LogOut,
  UserRound,
  Wrench,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

type ApiVideo = {
  title: string;
  url: string;
  thumbnail?: string | { cover?: string; preview?: string };
  duration?: string;
  video?: string;
  videoUrl?: string;
  stream?: string;
  mp4?: string;
  m3u8?: string;
  playback_url?: string;
  views?: string;
  uploader?: { name?: string; url?: string };
};

type ApiResponse = { success: boolean; source?: string; data?: ApiVideo | { results?: ApiVideo[] }; fetchedAt?: string };

const API_URL = "https://apis.davidcyril.name.ng/xxx/xnxx?q=asmr";
const FALLBACK_VIDEO: ApiVideo = {
  title: "A fresh signal is waiting in the feed",
  url: "https://www.xnxx.com",
  thumbnail: "",
  duration: "—",
  views: "Search feed",
  uploader: { name: "XNXX Search" },
};

function resolveThumbnail(path?: string | { cover?: string; preview?: string }) {
  const cover = typeof path === "object" ? path.cover : path;
  if (!cover) return "";
  if (cover.startsWith("http")) return cover;
  return `https://www.xnxx.com/${cover.replace(/^\//, "")}`;
}

function formatDuration(value?: string) {
  if (!value) return "—";
  const parts = value.split(":");
  return parts.length > 2 ? parts.slice(-2).join(":") : value;
}

function shortTitle(title: string) {
  return title.length > 82 ? `${title.slice(0, 79)}…` : title;
}

function directMediaUrl(item: ApiVideo) {
  const preview = typeof item.thumbnail === "object" ? item.thumbnail.preview : "";
  const candidate = item.videoUrl || item.video || item.stream || item.mp4 || item.m3u8 || item.playback_url || preview;
  return candidate?.startsWith("http") ? candidate : "";
}

function SignalMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "signal-mark signal-mark--small" : "signal-mark"} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

type HomeProps = { user: User; onProfile: () => void; onPricing: () => void; onPremium: () => void; onAdmin: () => void; onTools: () => void; onSignOut: () => Promise<void> };
const ADMIN_EMAILS = new Set(["mikeakex80@gmail.com", "elijahchinecheremonah@gmail.com"]);

export default function Home({ user, onProfile, onPricing, onPremium, onAdmin, onTools, onSignOut }: HomeProps) {
  const [video, setVideo] = useState<ApiVideo>(FALLBACK_VIDEO);
  const [previous, setPrevious] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consented, setConsented] = useState(() => localStorage.getItem("streamline-18-plus") === "true");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadFeed = useCallback(async (count = 6) => {
    setLoading(true);
    setError("");
    try {
      const payloads = await Promise.all(Array.from({ length: count }, async () => {
        const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return (await response.json()) as ApiResponse;
      }));
      const items = payloads.flatMap((payload) => {
        if (!payload.data) return [];
        if ("results" in payload.data) return payload.data.results || [];
        return [payload.data];
      }).filter((item): item is ApiVideo => "title" in item && Boolean(item.title));
      if (!items.length) throw new Error("The feed returned no video items.");
      setVideo(items[0]);
      setPrevious(items.slice(1).filter((item, index, all) => all.findIndex((candidate) => candidate.title === item.title) === index).slice(0, 5));
      setIsPlaying(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The signal was interrupted.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (consented) void loadFeed();
  }, [consented]);

  const thumbnail = useMemo(() => resolveThumbnail(video.thumbnail), [video.thumbnail]);
  const mediaUrl = useMemo(() => directMediaUrl(video), [video]);
  const isPreviewMedia = Boolean(mediaUrl && mediaUrl.includes("/preview.mp4"));

  const acceptGate = () => {
    localStorage.setItem("streamline-18-plus", "true");
    setConsented(true);
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText(video.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handlePlay = async () => {
    if (!mediaUrl || !videoRef.current) return;
    try {
      // This runs from the user’s play tap, so browsers allow audible playback here.
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
      setIsMuted(false);
      await videoRef.current.play();
      setIsPlaying(true);
    } catch {
      setError("The browser could not start this video stream.");
    }
  };

  const togglePlayback = async () => {
    if (!mediaUrl || !videoRef.current) return;
    if (videoRef.current.paused) await handlePlay();
    else videoRef.current.pause();
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Eliminator Streaming Platform and Multitools home">
          <span className="brand-mark"><SignalMark /></span>
          <span><strong>eliminator</strong><em>streaming</em></span>
        </a>
        <div className="topbar__status"><span className="status-dot" /> LIVE FEED <span className="topbar__divider" /> 18+ ONLY</div>
        <div className="topbar__account"><button className="shortcut-button shortcut-button--tools" onClick={onTools}><Wrench size={16} /><span>Multi-tools</span></button><button className="shortcut-button shortcut-button--plans" onClick={onPricing}><Sparkles size={16} /><span>Premium Plans</span></button><button className="shortcut-button shortcut-button--premium" onClick={onPremium}><Sparkles size={16} /><span>Premium Room</span></button>{ADMIN_EMAILS.has((user.email || "").toLowerCase()) && <button className="shortcut-button shortcut-button--admin" onClick={onAdmin}><ShieldCheck size={16} /><span>Admin Verify</span></button>}<button className="shortcut-button shortcut-button--profile" onClick={onProfile}><span className="profile-chip__avatar"><UserRound size={14} /></span><span>Profile</span></button><button className="shortcut-button shortcut-button--signout" onClick={onSignOut}><LogOut size={16} /><span>Sign out</span></button></div>
        <button className="refresh-button" onClick={() => loadFeed()} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Pull a new frame</span>
        </button>
      </header>

      <main id="top" className="page-layout">
        <aside className="side-rail">
          <div className="rail-intro"><span className="eyebrow">01 / PLAYBACK ROOM</span><p>A bright route from discovery to play.</p></div>
          <nav className="rail-nav" aria-label="Sections">
            <a className="rail-nav__item rail-nav__item--active" href="#player"><span>01</span>Now playing <ChevronRight size={15} /></a>
            <a className="rail-nav__item" href="#feed"><span>02</span>Fresh signal <ChevronRight size={15} /></a>
            <a className="rail-nav__item" href="#note"><span>03</span>Boundaries <ChevronRight size={15} /></a>
          </nav>
          <div className="rail-note"><ShieldCheck size={18} /><p>Source links stay visible. Nothing is hidden behind a mystery button.</p></div>
        </aside>

        <section className="content-canvas">
          <section className="hero-copy">
            <div className="hero-copy__text">
              <span className="eyebrow eyebrow--blue">THE DAILY DROP / {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase()}</span>
              <h1>Find the next<br /><i>good signal.</i></h1>
              <p>One fresh title from the live feed, presented with the useful bits up front. Press play on the source when you’re ready.</p>
            </div>
            <div className="hero-copy__stamp"><Sparkles size={18} /><span>CURATED<br /><b>RANDOMLY</b></span></div>
          </section>

          <section id="player" className="player-stage">
            <div className="stage-rings" aria-hidden="true"><span /><span /><span /></div>
            <div className="player-toolbar"><span><span className="signal-dot" /> SOURCE / XNXX SEARCH</span><span className="player-toolbar__right">SAFE LINK <ShieldCheck size={14} /></span></div>
            <div className="player-frame">
              {mediaUrl ? <video ref={videoRef} className="player-video" src={mediaUrl} poster={thumbnail || undefined} controls playsInline muted={isMuted} onLoadedMetadata={() => { if (videoRef.current) { videoRef.current.muted = false; videoRef.current.volume = 1; } }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} /> : thumbnail ? <img src={thumbnail} alt="" className="player-poster" /> : <div className="player-poster player-poster--fallback" />}
              <div className="player-wash" />
              <div className="player-center">
                {mediaUrl ? <button className="play-orbit" onClick={handlePlay} aria-label="Play video">{isPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={30} fill="currentColor" />}</button> : <div className="play-orbit play-orbit--disabled" aria-hidden="true"><CircleAlert size={27} /></div>}
                <span>{mediaUrl ? (isPlaying ? (isPreviewMedia ? "PREVIEW PLAYING IN ELIMINATOR" : "PLAYING IN ELIMINATOR") : (isPreviewMedia ? "PLAY PREVIEW ON THIS PAGE" : "PLAY ON THIS PAGE")) : "NO DIRECT VIDEO STREAM"}</span>{!mediaUrl && <small className="player-unavailable-copy">This API item has a thumbnail and source metadata, but no playable video URL. Use <button className="player-refresh-link" onClick={() => loadFeed()}>Pull a new frame</button> to try another title.</small>}
              </div>
              <div className="player-controls">
                <button onClick={togglePlayback} aria-label={isPlaying ? "Pause video" : "Play video"} disabled={!mediaUrl}>{isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
                <div className="timeline"><span style={{ width: mediaUrl ? "8%" : "0%" }} /></div>
                <span className="control-time">{formatDuration(video.duration)}</span>
                <button onClick={() => { const nextMuted = !isMuted; setIsMuted(nextMuted); if (videoRef.current) { videoRef.current.muted = nextMuted; videoRef.current.volume = nextMuted ? 0 : 1; } }} aria-label={isMuted ? "Unmute" : "Mute"} disabled={!mediaUrl}>{isMuted ? <Volume2 size={16} /> : <Volume2 size={16} fill="currentColor" />}</button>
                <span className="in-site-badge">{mediaUrl ? (isPreviewMedia ? "PREVIEW" : "IN-SITE") : "METADATA"}</span>
              </div>
            </div>
            <div className="player-caption"><div><span className="eyebrow">CURRENT SIGNAL</span><h2>{loading ? "Tuning into the feed…" : shortTitle(video.title)}</h2></div><button className="outline-button" onClick={copyLink}>{copied ? <><Check size={16} /> Link copied</> : <>Copy source URL <ArrowUpRight size={16} /></>}</button></div>
          </section>

          <section className="details-row">
            <div className="detail-card detail-card--primary"><span className="eyebrow">ABOUT THIS FRAME</span><p>{video.uploader?.name ? `Published by ${video.uploader.name}.` : "Published by the live feed."} This page surfaces the source metadata before you decide to continue.</p><div className="detail-card__meta"><span><Clock3 size={14} /> {formatDuration(video.duration)}</span><span><Sparkles size={14} /> {video.views || "Fresh"}</span></div></div>
            <div className="detail-card detail-card--accent"><span className="eyebrow eyebrow--blue">IN-SITE PLAYBACK</span><p>{mediaUrl ? (isPreviewMedia ? "This endpoint provides a browser-playable MP4 preview, not the complete movie. It plays inside Eliminator without leaving the page." : "This item includes a direct stream, so it plays inside Eliminator without leaving the page.") : "This title can’t play here because the API did not provide a direct MP4 or HLS stream. Use Pull a new frame to try another title."}</p><button className="text-button" onClick={copyLink}>{copied ? <><Check size={15} /> Source URL copied</> : <>Copy source URL <ArrowUpRight size={15} /></>}</button></div>
          </section>

          <section className="monetization-card"><div><span className="eyebrow eyebrow--red">MONETIZATION READY</span><h2>Make the platform sustainable.</h2><p>This reserved in-site slot can hold an approved AdSense unit, direct sponsor creative, or a paid-membership CTA once your publisher or payment IDs are ready.</p></div><a className="red-button" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20monetization">Discuss monetization <ArrowUpRight size={16} /></a></section>

          <section id="feed" className="feed-section"><div className="section-heading"><div><span className="eyebrow">02 / RECENT FRAMES</span><h2>Keep the signal moving.</h2></div><button className="text-button" onClick={() => loadFeed()}>Refresh feed <RefreshCw size={15} /></button></div><div className="feed-grid">{previous.length ? previous.map((item, index) => <button className="feed-card" key={`${item.title}-${index}`} onClick={() => { setVideo(item); setIsPlaying(false); }}><div className="feed-card__image" style={{ backgroundImage: item.thumbnail ? `url(${resolveThumbnail(item.thumbnail)})` : undefined }}><span>0{index + 1}</span><Play size={17} fill="currentColor" /></div><div className="feed-card__body"><span className="eyebrow">RECENT FRAME</span><h3>{shortTitle(item.title)}</h3><p>{item.views || "Live feed"} · {formatDuration(item.duration)}</p></div></button>) : <div className="feed-empty"><LoaderCircle size={18} className={loading ? "spin" : ""} /> Pulling the first frames into view…</div>}</div></section>

          <section id="note" className="footer-note"><CircleAlert size={17} /><p><b>18+ notice.</b> This interface connects to a third-party adult-content API. Continue only if you are legally an adult in your location. Eliminator Streaming Platform and Multitools does not host or control the source media. <a className="feedback-link" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20feedback">Send feedback</a></p></section>
        </section>
      </main>

      {error && <div className="toast-error"><CircleAlert size={17} /><span>{error}</span><button onClick={() => loadFeed()}>Try again</button></div>}

      {!consented && <div className="gate-backdrop"><div className="age-gate"><div className="age-gate__mark"><SignalMark small /></div><span className="eyebrow eyebrow--blue">A QUICK CHECK BEFORE PLAY</span><h2>This feed is for adults only.</h2><p>The connected source can return explicit material. Confirm that you are 18+ and legally allowed to view adult content where you are.</p><div className="age-gate__actions"><button className="primary-button" onClick={acceptGate}>I’m 18+ — continue <ArrowUpRight size={16} /></button><a href="https://www.google.com" className="secondary-button">Leave page</a></div><small>By continuing, you acknowledge the source-content boundary.</small></div></div>}
    </div>
  );
}
