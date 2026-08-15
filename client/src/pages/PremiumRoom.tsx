import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, CircleAlert, LockKeyhole, LogOut, Play, RefreshCw, Sparkles, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import PremiumBadge from "@/components/PremiumBadge";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";
import { getTikTokBoostUrl, isTikTokTarget, type TikTokBoostType } from "@/lib/tiktokBoost";
import { getYouTubeBoostUrl, isYouTubeTarget, type YouTubeBoostType } from "@/lib/youtubeBoost";
import { getApkDownloaderUrl, isApkSearch, type ApkResult } from "@/lib/apkDownloader";

type PremiumRoomProps = { user: User; isPremium: boolean; onBack: () => void; onPricing: () => void; onSignOut: () => Promise<void> };
type PremiumVideo = { title: string; thumbnail?: string; download_url?: string };
type BoostResult = Record<string, unknown> & { success?: boolean; message?: string };

const PREMIUM_XVIDEO_URL = `https://apis.davidcyril.name.ng/xvideo?url=${encodeURIComponent("https://www.xvideos.com/video.hppakie6a79/mia_khalifa_fucks_a_fanboy")}`;

export default function PremiumRoom({ user, isPremium, onBack, onPricing, onSignOut }: PremiumRoomProps) {
  const [video, setVideo] = useState<PremiumVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
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

  const loadPremiumVideo = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(PREMIUM_XVIDEO_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Premium feed request failed (${response.status})`);
      const payload = (await response.json()) as PremiumVideo;
      if (!payload.title) throw new Error("The Premium feed returned no playable title.");
      setVideo(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Premium feed is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isPremium) void loadPremiumVideo(); }, [isPremium]);

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

  const activeContent = (
    <>
      <section className="premium-app-launcher"><div className="premium-app-launcher__intro"><span className="eyebrow eyebrow--red">ELIMINATOR PREMIUM APPS</span><h2>Your private toolkit, curated.</h2><p>Choose a focused workspace below. Premium turns individual APIs into guided products with clear inputs, richer results, and mobile-ready actions.</p></div><div className="premium-app-grid"><button className="premium-app-tile premium-app-tile--video" onClick={() => document.getElementById("premium-video-lounge")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Play size={20} /></span><strong>Video Lounge</strong><small>Private XVideo playback</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--growth" onClick={() => document.getElementById("premium-tiktok-boost")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Zap size={20} /></span><strong>Growth Desk</strong><small>TikTok + YouTube tools</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--music" onClick={() => document.getElementById("premium-toolkit")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><Sparkles size={20} /></span><strong>Creator Desk</strong><small>Music and new creative apps</small><b>OPEN APP →</b></button><button className="premium-app-tile premium-app-tile--vault" onClick={() => document.getElementById("premium-apk-vault")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span className="premium-app-tile__icon"><LockKeyhole size={20} /></span><strong>APK Vault</strong><small>Curated app downloads</small><b>OPEN APP →</b></button></div></section><section id="premium-video-lounge" className="premium-room-card premium-room-card--active">
        <div className="premium-room-card__badge-row"><span className="premium-room-icon"><Sparkles size={24} /></span><PremiumBadge state="active" /></div>
        <span className="eyebrow eyebrow--red">PREMIUM VIDEO LOUNGE</span>
        <h1>Your premium<br /><i>signal is live.</i></h1>
        <p>Welcome, {user.user_metadata?.full_name || user.email?.split("@")[0] || "member"}. {hasPermanentPremiumAccess(user.email) ? "Your owner account has permanent Premium access." : "This private room is available because an approved administrator activated your entitlement."}</p>
        <div className="premium-benefits"><span><Check size={16} /> Premium account status confirmed</span><span><Check size={16} /> XVideo playback inside Eliminator</span><span><Check size={16} /> New premium features can be added here</span></div>
      </section>
      <section className="premium-video-card">
        <div className="premium-video-card__heading"><div><span className="eyebrow eyebrow--red">PRIVATE PLAYBACK</span><h2>{video?.title || (loading ? "Tuning the Premium signal…" : "Premium video lounge")}</h2></div><button className="text-button" onClick={() => void loadPremiumVideo()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh</button></div>
        {video?.download_url ? <div className="premium-video-frame"><video src={video.download_url} poster={video.thumbnail} controls playsInline onPlay={(event) => { event.currentTarget.muted = false; event.currentTarget.volume = 1; setPlaying(true); }} onPause={() => setPlaying(false)} /><span className="premium-video-audio"><Play size={13} /> {playing ? "AUDIBLE PLAYBACK" : "TAP PLAY TO HEAR AUDIO"}</span></div> : <div className="premium-video-empty">{error ? <><CircleAlert size={18} /> {error}</> : <><RefreshCw size={18} className={loading ? "spin" : ""} /> {loading ? "Loading the Premium video…" : "No direct video is available yet."}</>}</div>}
      </section>
      <section id="premium-tiktok-boost" className="premium-tool-card">
        <div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / SOCIAL BOOST</span><h2>TikTok Boost</h2></div><Zap size={22} /></div>
        <p className="premium-tool-card__lead">Send a TikTok video or profile target to the connected service and see its exact response here. Use this only for accounts and content you own or are authorized to manage, and follow TikTok’s rules.</p>
        <form className="premium-boost-form" onSubmit={submitBoost}>
          <label>Target URL or username<input value={boostTarget} onChange={(event) => setBoostTarget(event.target.value)} placeholder={boostType === "followers" ? "@username or TikTok profile URL" : "https://www.tiktok.com/@name/video/123..."} inputMode="url" /></label>
          <label>Service<select value={boostType} onChange={(event) => setBoostType(event.target.value as TikTokBoostType)}><option value="video_views">Video views</option><option value="like">Likes</option><option value="followers">Followers</option></select></label>
          <button className="red-button premium-boost-submit" type="submit" disabled={boostLoading}>{boostLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{boostLoading ? "Checking service…" : "Run TikTok Boost"}</button>
        </form>
        {boostError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{boostError}</span></div>}
        {boostResult && <div className={`premium-boost-result ${boostResult.success === true ? "premium-boost-result--success" : "premium-boost-result--notice"}`}><div><strong>{boostResult.success === true ? "Service accepted the request" : "Service response"}</strong><p>{String(boostResult.message || (boostResult.success === true ? "The API reported success." : "The API did not report a successful boost."))}</p></div><pre>{JSON.stringify(boostResult, null, 2)}</pre></div>}
      </section>
      <section id="premium-youtube-studio" className="premium-tool-card premium-tool-card--youtube"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / SOCIAL BOOST</span><h2>YouTube View Booster</h2></div><Zap size={22} /></div><p className="premium-tool-card__lead">Submit a YouTube video or channel target to the connected service and see the exact accepted amount, message, and JSON response. A successful API response means the service accepted the request; it does not promise an immediate YouTube metric change.</p><form className="premium-boost-form" onSubmit={submitYouTubeBoost}><label>Target URL<input value={youtubeTarget} onChange={(event) => setYoutubeTarget(event.target.value)} placeholder={youtubeType === "subscribers" ? "https://www.youtube.com/@channel" : "https://www.youtube.com/watch?v=..."} inputMode="url" /></label><label>Service<select value={youtubeType} onChange={(event) => setYoutubeType(event.target.value as YouTubeBoostType)}><option value="views">Video views</option><option value="likes">Likes</option><option value="subscribers">Subscribers</option></select></label><button className="red-button premium-boost-submit" type="submit" disabled={youtubeLoading}>{youtubeLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{youtubeLoading ? "Checking service…" : "Run YouTube Boost"}</button></form>{youtubeError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{youtubeError}</span></div>}{youtubeResult && <div className={`premium-boost-result ${youtubeResult.success === true ? "premium-boost-result--success" : "premium-boost-result--notice"}`}><div><strong>{youtubeResult.success === true ? "Service accepted the request" : "Service response"}</strong><p>{String(youtubeResult.message || (youtubeResult.success === true ? "The API reported success." : "The API did not report a successful request."))}</p>{youtubeResult.amount !== undefined && <small>Reported amount: {String(youtubeResult.amount)} · Type: {String(youtubeResult.type || youtubeType)}</small>}</div><pre>{JSON.stringify(youtubeResult, null, 2)}</pre></div>}</section>      <section id="premium-apk-vault" className="premium-tool-card premium-tool-card--apk"><div className="premium-tool-card__heading"><div><span className="eyebrow eyebrow--red">PREMIUM TOOL / APP UTILITY</span><h2>APK App Downloader</h2></div><Zap size={22} /></div><p className="premium-tool-card__lead">Search the connected APK catalog by app name, review the returned package details, and download the exact APK link returned by the service. Always verify the source, package, permissions, and device compatibility before installing.</p><form className="premium-boost-form" onSubmit={submitApkSearch}><label>App name<input value={apkSearch} onChange={(event) => setApkSearch(event.target.value)} placeholder="WhatsApp, Telegram, Spotify…" autoCapitalize="words" /></label><button className="red-button premium-boost-submit" type="submit" disabled={apkLoading}>{apkLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}{apkLoading ? "Searching APK catalog…" : "Find APK"}</button></form>{apkError && <div className="premium-boost-result premium-boost-result--error"><CircleAlert size={17} /><span>{apkError}</span></div>}{apkResult?.apk && <div className="apk-result-card">{apkResult.apk.icon && <img src={apkResult.apk.icon} alt="" className="apk-result-card__icon" />}<div className="apk-result-card__identity"><strong>{apkResult.apk.name || "APK result"}</strong><span>{apkResult.apk.package || "Package not provided"}</span><small>Version / update: {apkResult.apk.lastUpdated || "Not provided"}</small></div>{apkResult.apk.downloadLink && <a className="red-button apk-download-button" href={apkResult.apk.downloadLink} target="_blank" rel="noreferrer">Download APK <ArrowLeft size={16} className="rotate-180" /></a>}<details className="apk-result-card__details"><summary>View exact API response</summary><pre>{JSON.stringify(apkResult, null, 2)}</pre></details></div>}<p className="apk-safety-note"><LockKeyhole size={14} /> Eliminator displays the API result; it does not scan or certify APK safety.</p></section><section id="premium-toolkit" className="premium-tool-card premium-tool-card--future"><span className="eyebrow">PREMIUM TOOLKIT</span><h2>More premium functions coming here.</h2><p>This room is ready for additional approved API workspaces without changing the protected layout.</p></section>
    </>
  );

  return <div className="premium-room-shell"><header className="profile-topbar"><a className="brand" href="#premium" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>premium</em></span></a><div className="profile-topbar__actions"><PremiumBadge state={isPremium ? "active" : "inactive"} compact /><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header><main className="premium-room-layout">{isPremium ? activeContent : <section className="premium-room-card"><span className="premium-room-icon premium-room-icon--locked"><LockKeyhole size={24} /></span><PremiumBadge state="inactive" /><span className="eyebrow eyebrow--red">PREMIUM ACCESS REQUIRED</span><h1>This room is<br /><i>locked for now.</i></h1><p>Your account has not been activated by an approved administrator yet. Contact the Eliminator team on WhatsApp, then return after your Customer ID has been verified.</p><button className="red-button" onClick={onPricing}>Request Premium access <Sparkles size={16} /></button></section>}</main></div>;
}
