import { useEffect, useState } from "react";
import { ArrowLeft, Check, CircleAlert, LockKeyhole, LogOut, Play, RefreshCw, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import PremiumBadge from "@/components/PremiumBadge";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";

type PremiumRoomProps = { user: User; isPremium: boolean; onBack: () => void; onPricing: () => void; onSignOut: () => Promise<void> };

type PremiumVideo = { title: string; thumbnail?: string; download_url?: string };
const PREMIUM_XVIDEO_URL = `https://apis.davidcyril.name.ng/xvideo?url=${encodeURIComponent("https://www.xvideos.com/video.hppakie6a79/mia_khalifa_fucks_a_fanboy")}`;

export default function PremiumRoom({ user, isPremium, onBack, onPricing, onSignOut }: PremiumRoomProps) {
  const [video, setVideo] = useState<PremiumVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);

  const loadPremiumVideo = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(PREMIUM_XVIDEO_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Premium feed request failed (${response.status})`);
      const payload = (await response.json()) as PremiumVideo & { success?: boolean };
      if (!payload.title) throw new Error("The Premium feed returned no playable title.");
      setVideo(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Premium feed is unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isPremium) void loadPremiumVideo(); }, [isPremium]);

  return <div className="premium-room-shell"><header className="profile-topbar"><a className="brand" href="#premium" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>premium</em></span></a><div className="profile-topbar__actions"><PremiumBadge state={isPremium ? "active" : "inactive"} compact /><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header><main className="premium-room-layout">{isPremium ? <><section className="premium-room-card premium-room-card--active"><div className="premium-room-card__badge-row"><span className="premium-room-icon"><Sparkles size={24} /></span><PremiumBadge state="active" /></div><span className="eyebrow eyebrow--red">PREMIUM VIDEO LOUNGE</span><h1>Your premium<br /><i>signal is live.</i></h1><p>Welcome, {user.user_metadata?.full_name || user.email?.split("@")[0] || "member"}. {hasPermanentPremiumAccess(user.email) ? "Your owner account has permanent Premium access." : "This private room is available because an approved administrator activated your entitlement."}</p><div className="premium-benefits"><span><Check size={16} /> Premium account status confirmed</span><span><Check size={16} /> XVideo playback inside Eliminator</span><span><Check size={16} /> New premium features can be added here</span></div></section><section className="premium-video-card"><div className="premium-video-card__heading"><div><span className="eyebrow eyebrow--red">PRIVATE PLAYBACK</span><h2>{video?.title || (loading ? "Tuning the Premium signal…" : "Premium video lounge")}</h2></div><button className="text-button" onClick={() => void loadPremiumVideo()} disabled={loading}><RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh</button></div>{video?.download_url ? <div className="premium-video-frame"><video src={video.download_url} poster={video.thumbnail} controls playsInline onPlay={(event) => { const element = event.currentTarget; element.muted = false; element.volume = 1; setPlaying(true); }} onPause={() => setPlaying(false)} /><span className="premium-video-audio"><Play size={13} /> {playing ? "AUDIBLE PLAYBACK" : "TAP PLAY TO HEAR AUDIO"}</span></div> : <div className="premium-video-empty">{error ? <><CircleAlert size={18} /> {error}</> : <><RefreshCw size={18} className={loading ? "spin" : ""} /> {loading ? "Loading the Premium video…" : "No direct video is available yet."}</>}</div>}</section></> : <section className="premium-room-card"><span className="premium-room-icon premium-room-icon--locked"><LockKeyhole size={24} /></span><PremiumBadge state="inactive" /><span className="eyebrow eyebrow--red">PREMIUM ACCESS REQUIRED</span><h1>This room is<br /><i>locked for now.</i></h1><p>Your account has not been activated by an approved administrator yet. Contact the Eliminator team on WhatsApp, then return after your Customer ID has been verified.</p><button className="red-button" onClick={onPricing}>Request Premium access <Sparkles size={16} /></button></section>}</main></div>;
}
