/* Coastal Signal profile room: account details and avatar identity share the same calm, explicit save states. */
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, CheckCircle2, CircleAlert, Copy, Crown, Clock3, LoaderCircle, LogOut, Mail, Save, ShieldCheck, UserRound, XCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { profileErrorMessage } from "@/lib/profileErrors";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";

type ProfileProps = { user: User; onBack: () => void; onSignOut: () => Promise<void> };
type PremiumStatus = "active" | "pending" | "inactive";


function initials(name: string, email?: string) {
  const source = name.trim() || email?.split("@")[0] || "Viewer";
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}


export default function Profile({ user, onBack, onSignOut }: ProfileProps) {
  const [fullName, setFullName] = useState(String(user.user_metadata?.full_name || ""));
  const [avatarUrl, setAvatarUrl] = useState(String(user.user_metadata?.avatar_url || ""));
  const [createdAt, setCreatedAt] = useState(user.created_at);
  const [premiumActivatedAt, setPremiumActivatedAt] = useState<string | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>("inactive");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!supabase) return;
      const [{ data, error: profileError }, { data: entitlement }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url, created_at").eq("id", user.id).maybeSingle(),
        supabase.from("premium_entitlements").select("active, activated_by, activated_at").eq("user_id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      if (profileError) {
        setError(profileErrorMessage(profileError.message, "load"));
      }
      if (!profileError && data?.full_name) setFullName(data.full_name);
      if (!profileError && data?.avatar_url) setAvatarUrl(data.avatar_url);
      if (!profileError && data?.created_at) setCreatedAt(data.created_at);
      const ownerPremium = hasPermanentPremiumAccess(user.email);
      const nextPremiumStatus: PremiumStatus = ownerPremium || entitlement?.active ? "active" : entitlement ? (entitlement.activated_by ? "inactive" : "pending") : "inactive";
      setPremiumStatus(nextPremiumStatus);
      setPremiumActivatedAt(entitlement?.active && entitlement.activated_at ? entitlement.activated_at : null);
      setLoading(false);
    };
    void loadProfile();
    return () => { active = false; };
  }, [user.id]);

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !supabase) return;
    setError("");
    setSaved(false);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar images must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
    if (uploadError) {
      setError(uploadError.message.includes("bucket") ? "The avatars bucket is not ready yet. Run the updated supabase/schema.sql setup." : uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName.trim() || "Viewer", email: user.email || "", avatar_url: publicUrl }, { onConflict: "id" });
    if (profileError) {
      setError(profileErrorMessage(profileError.message, "save"));
    } else {
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      setSaved(true);
    }
    setUploading(false);
  };

  const copyUserId = async () => {
    const fallbackCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = user.id;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    };
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(user.id);
      else fallbackCopy();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      fallbackCopy();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (fullName.trim().length < 2) {
      setError("Please enter at least two characters for your name.");
      return;
    }
    if (!supabase) {
      setError("Supabase is not available in this deployment.");
      return;
    }
    setSaving(true);
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName.trim(), email: user.email || "", avatar_url: avatarUrl || null }, { onConflict: "id" });
    if (profileError) {
      setError(profileErrorMessage(profileError.message, "save"));
    } else {
      await supabase.auth.updateUser({ data: { full_name: fullName.trim(), avatar_url: avatarUrl || null } });
      setSaved(true);
    }
    setSaving(false);
  };

  return <div className="profile-shell"><header className="profile-topbar"><a className="brand" href="#top" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>eliminator</strong><em>streaming</em></span></a><div className="profile-topbar__actions"><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><a className="profile-link profile-link--muted" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20feedback">Feedback</a><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header>
    <main className="profile-layout"><section className="profile-intro"><span className="eyebrow eyebrow--blue">03 / VIEWER PROFILE</span><h1>Keep your<br /><i>signal personal.</i></h1><p>Your account details travel with your playback room. Update your name and avatar here; your email remains managed securely by Supabase Auth.</p><div className="profile-trust"><ShieldCheck size={18} /><div><b>Protected account</b><span>Only you can read or update this profile.</span></div></div></section>
      <section className="profile-card"><div className="profile-avatar-wrap"><div className="profile-avatar profile-avatar--photo">{avatarUrl ? <img src={avatarUrl} alt="Profile avatar" /> : <span>{initials(fullName, user.email)}</span>}</div><button className="avatar-upload-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Upload profile avatar">{uploading ? <LoaderCircle size={16} className="spin" /> : <Camera size={16} />}</button><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadAvatar} hidden /></div><div className="profile-avatar-hint">PNG, JPG, WEBP, or GIF · max 5 MB</div><div className="profile-card__heading"><div><span className="eyebrow">ACCOUNT DETAILS</span><h2>{fullName || "Your profile"}</h2></div><span className={`profile-status profile-status--premium profile-status--${premiumStatus}`}><span /> {premiumStatus === "active" ? "PREMIUM ACTIVE" : premiumStatus === "pending" ? "AWAITING VERIFICATION" : "PREMIUM INACTIVE"}</span></div>
        <form className="profile-form" onSubmit={saveProfile}><label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" disabled={loading || saving || uploading} autoComplete="name" /></label><label>Email address<div className="profile-readonly"><Mail size={16} /><input value={user.email || "Not available"} readOnly /><span>Verified by auth</span></div></label><div className="profile-user-id"><div><span className="profile-user-id__label">Customer / User ID</span><code>{user.id}</code><small>Copy this ID and enter it in Premium Admin to activate this customer.</small></div><button className="secondary-button profile-user-id__copy" type="button" onClick={() => void copyUserId()} aria-label="Copy customer User ID">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy ID"}</button></div><div className="profile-meta"><span>Member since</span><b>{new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</b></div><div className={`premium-status-panel premium-status-panel--${premiumStatus}`} role="status" aria-label={`Premium status: ${premiumStatus}`}><span className="premium-status-panel__icon">{premiumStatus === "active" ? <CheckCircle2 size={22} /> : premiumStatus === "pending" ? <Clock3 size={22} /> : <XCircle size={22} />}</span><div className="premium-status-panel__copy"><span className="premium-status-panel__eyebrow"><Crown size={13} /> PREMIUM ACCESS</span><strong>{premiumStatus === "active" ? "Premium is currently active" : premiumStatus === "pending" ? "Premium is awaiting verification" : "Premium is currently inactive"}</strong><small>{premiumStatus === "active" ? premiumActivatedAt ? `Activated ${new Date(premiumActivatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Your account is ready for premium features.` : hasPermanentPremiumAccess(user.email) ? "Owner access is permanently enabled for this account." : "Your account is ready for premium features." : premiumStatus === "pending" ? "Your request is waiting for an approved admin to verify the WhatsApp transaction." : "Premium access is not active. Request verification from the Plans page when ready."}</small></div><span className="premium-status-panel__badge">{premiumStatus === "active" ? "ACTIVE" : premiumStatus === "pending" ? "PENDING" : "INACTIVE"}</span></div>{error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}{saved && <div className="auth-message auth-message--success"><Check size={16} /><span>Your profile has been updated.</span></div>}<button className="primary-button profile-save" type="submit" disabled={loading || saving || uploading}>{saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}{saving ? "Saving changes…" : "Save profile"}</button></form>
      </section></main>
  </div>;
}
