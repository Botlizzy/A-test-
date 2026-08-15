/* Coastal Signal: editorial video discovery, Tide Blue actions, signal-led motion, playback-first hierarchy. */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Volume2,
  LogOut,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

type ApiVideo = {
  title: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  views?: string;
  uploader?: { name?: string; url?: string };
};

type ApiResponse = { success: boolean; source?: string; data?: ApiVideo; fetchedAt?: string };

const API_URL = "https://apis.davidcyril.name.ng/xhamster/random";
const FALLBACK_VIDEO: ApiVideo = {
  title: "A fresh signal is waiting in the feed",
  url: "https://xhamster.com",
  thumbnail: "",
  duration: "—",
  views: "Live feed",
  uploader: { name: "xHamster Trending" },
};

function resolveThumbnail(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://xhamster.com/${path.replace(/^\//, "")}`;
}

function formatDuration(value?: string) {
  if (!value) return "—";
  const parts = value.split(":");
  return parts.length > 2 ? parts.slice(-2).join(":") : value;
}

function shortTitle(title: string) {
  return title.length > 82 ? `${title.slice(0, 79)}…` : title;
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

type HomeProps = { user: User; onSignOut: () => Promise<void> };

export default function Home({ user, onSignOut }: HomeProps) {
  const [video, setVideo] = useState<ApiVideo>(FALLBACK_VIDEO);
  const [previous, setPrevious] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consented, setConsented] = useState(() => localStorage.getItem("streamline-18-plus") === "true");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadFeed = useCallback(async (count = 6) => {
    setLoading(true);
    setError("");
    try {
      const payloads = await Promise.all(Array.from({ length: count }, async () => {
        const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return (await response.json()) as ApiResponse;
      }));
      const items = payloads.map((payload) => payload.data).filter((item): item is ApiVideo => Boolean(item?.title));
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

  const acceptGate = () => {
    localStorage.setItem("streamline-18-plus", "true");
    setConsented(true);
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText(video.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const openSource = () => window.open(video.url, "_blank", "noopener,noreferrer");

  return (
    <div className="app-shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Streamline Video home">
          <span className="brand-mark"><SignalMark /></span>
          <span><strong>streamline</strong><em>video</em></span>
        </a>
        <div className="topbar__status"><span className="status-dot" /> LIVE FEED <span className="topbar__divider" /> 18+ ONLY</div>
        <div className="topbar__account"><span>{user.user_metadata?.full_name || user.email?.split("@")[0] || "Viewer"}</span><button className="refresh-button" onClick={onSignOut}><LogOut size={16} /><span>Sign out</span></button></div>
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
            <div className="player-toolbar"><span><span className="signal-dot" /> SOURCE / XHAMSTER TRENDING</span><span className="player-toolbar__right">SAFE LINK <ShieldCheck size={14} /></span></div>
            <div className="player-frame">
              {thumbnail ? <img src={thumbnail} alt="" className="player-poster" /> : <div className="player-poster player-poster--fallback" />}
              <div className="player-wash" />
              <div className="player-center">
                <button className="play-orbit" onClick={openSource} aria-label="Open video on source">
                  {isPlaying ? <Pause size={27} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
                </button>
                <span>{isPlaying ? "OPENING SOURCE" : "PRESS TO WATCH"}</span>
              </div>
              <div className="player-controls">
                <button onClick={openSource} aria-label="Open video"><Play size={16} fill="currentColor" /></button>
                <div className="timeline"><span style={{ width: isPlaying ? "34%" : "8%" }} /></div>
                <span className="control-time">{formatDuration(video.duration)}</span>
                <button onClick={() => setIsMuted((value) => !value)} aria-label={isMuted ? "Unmute" : "Mute"}>{isMuted ? <Volume2 size={16} /> : <Volume2 size={16} fill="currentColor" />}</button>
                <button onClick={openSource} aria-label="Open in new tab"><ExternalLink size={16} /></button>
              </div>
            </div>
            <div className="player-caption"><div><span className="eyebrow">CURRENT SIGNAL</span><h2>{loading ? "Tuning into the feed…" : shortTitle(video.title)}</h2></div><button className="outline-button" onClick={openSource}>Watch source <ArrowUpRight size={16} /></button></div>
          </section>

          <section className="details-row">
            <div className="detail-card detail-card--primary"><span className="eyebrow">ABOUT THIS FRAME</span><p>{video.uploader?.name ? `Published by ${video.uploader.name}.` : "Published by the live feed."} This page surfaces the source metadata before you decide to continue.</p><div className="detail-card__meta"><span><Clock3 size={14} /> {formatDuration(video.duration)}</span><span><Sparkles size={14} /> {video.views || "Fresh"}</span></div></div>
            <div className="detail-card detail-card--accent"><span className="eyebrow eyebrow--blue">SOURCE HANDOFF</span><p>This API provides a source page and thumbnail, not a direct media stream. Watch opens the original page in a new tab.</p><button className="text-button" onClick={copyLink}>{copied ? <><Check size={15} /> Link copied</> : <>Copy source link <ArrowUpRight size={15} /></>}</button></div>
          </section>

          <section id="feed" className="feed-section"><div className="section-heading"><div><span className="eyebrow">02 / RECENT FRAMES</span><h2>Keep the signal moving.</h2></div><button className="text-button" onClick={() => loadFeed()}>Refresh feed <RefreshCw size={15} /></button></div><div className="feed-grid">{previous.length ? previous.map((item, index) => <button className="feed-card" key={`${item.title}-${index}`} onClick={() => { setVideo(item); setIsPlaying(false); }}><div className="feed-card__image" style={{ backgroundImage: item.thumbnail ? `url(${resolveThumbnail(item.thumbnail)})` : undefined }}><span>0{index + 1}</span><Play size={17} fill="currentColor" /></div><div className="feed-card__body"><span className="eyebrow">RECENT FRAME</span><h3>{shortTitle(item.title)}</h3><p>{item.views || "Live feed"} · {formatDuration(item.duration)}</p></div></button>) : <div className="feed-empty"><LoaderCircle size={18} className={loading ? "spin" : ""} /> Pulling the first frames into view…</div>}</div></section>

          <section id="note" className="footer-note"><CircleAlert size={17} /><p><b>18+ notice.</b> This interface connects to a third-party adult-content API. Continue only if you are legally an adult in your location. Streamline Video does not host or control the source media.</p></section>
        </section>
      </main>

      {error && <div className="toast-error"><CircleAlert size={17} /><span>{error}</span><button onClick={() => loadFeed()}>Try again</button></div>}

      {!consented && <div className="gate-backdrop"><div className="age-gate"><div className="age-gate__mark"><SignalMark small /></div><span className="eyebrow eyebrow--blue">A QUICK CHECK BEFORE PLAY</span><h2>This feed is for adults only.</h2><p>The connected source can return explicit material. Confirm that you are 18+ and legally allowed to view adult content where you are.</p><div className="age-gate__actions"><button className="primary-button" onClick={acceptGate}>I’m 18+ — continue <ArrowUpRight size={16} /></button><a href="https://www.google.com" className="secondary-button">Leave page</a></div><small>By continuing, you acknowledge the source-content boundary.</small></div></div>}
    </div>
  );
}
