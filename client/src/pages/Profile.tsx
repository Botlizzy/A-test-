/* Coastal Signal profile room: give account details a calm editorial home with one obvious save action. */
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, CircleAlert, LoaderCircle, LogOut, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type ProfileProps = { user: User; onBack: () => void; onSignOut: () => Promise<void> };

export default function Profile({ user, onBack, onSignOut }: ProfileProps) {
  const [fullName, setFullName] = useState(String(user.user_metadata?.full_name || ""));
  const [createdAt, setCreatedAt] = useState(user.created_at);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!supabase) return;
      const { data, error: profileError } = await supabase.from("profiles").select("full_name, created_at").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (!profileError && data?.full_name) setFullName(data.full_name);
      if (!profileError && data?.created_at) setCreatedAt(data.created_at);
      setLoading(false);
    };
    void loadProfile();
    return () => { active = false; };
  }, [user.id]);

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
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName.trim(), email: user.email || "" }, { onConflict: "id" });
    if (profileError) {
      setError(profileError.message.includes("profiles") ? "The profiles table is not ready yet. Run supabase/schema.sql in Supabase SQL Editor." : profileError.message);
    } else {
      await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      setSaved(true);
    }
    setSaving(false);
  };

  return <div className="profile-shell"><header className="profile-topbar"><a className="brand" href="#top" onClick={(event) => { event.preventDefault(); onBack(); }}><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><span><strong>streamline</strong><em>video</em></span></a><div className="profile-topbar__actions"><button className="profile-link" onClick={onBack}><ArrowLeft size={15} /> Back to feed</button><button className="profile-link profile-link--muted" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div></header>
    <main className="profile-layout"><section className="profile-intro"><span className="eyebrow eyebrow--blue">03 / VIEWER PROFILE</span><h1>Keep your<br /><i>signal personal.</i></h1><p>Your account details travel with your playback room. Update your name here; your email remains managed securely by Supabase Auth.</p><div className="profile-trust"><ShieldCheck size={18} /><div><b>Protected account</b><span>Only you can read or update this profile.</span></div></div></section>
      <section className="profile-card"><div className="profile-avatar"><UserRound size={28} /></div><div className="profile-card__heading"><div><span className="eyebrow">ACCOUNT DETAILS</span><h2>{fullName || "Your profile"}</h2></div><span className="profile-status"><span /> ACTIVE</span></div>
        <form className="profile-form" onSubmit={saveProfile}><label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" disabled={loading || saving} autoComplete="name" /></label><label>Email address<div className="profile-readonly"><Mail size={16} /><input value={user.email || "Not available"} readOnly /><span>Verified by auth</span></div></label><div className="profile-meta"><span>Member since</span><b>{new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</b></div>{error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}{saved && <div className="auth-message auth-message--success"><Check size={16} /><span>Your profile has been updated.</span></div>}<button className="primary-button profile-save" type="submit" disabled={loading || saving}>{saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}{saving ? "Saving changes…" : "Save profile"}</button></form>
      </section></main>
  </div>;
}
