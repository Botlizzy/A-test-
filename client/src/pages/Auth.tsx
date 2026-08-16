/* Coastal Signal auth: calm, high-contrast entry screens that keep the primary action obvious and the source boundary visible. */
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/lib/supabase";
import { getConfirmationMessage, getConfirmationRedirect, hasConfirmedEmail } from "@/lib/authRedirect";
import { formatAuthError } from "@/lib/authErrors";

type AuthMode = "login" | "signup";

type AuthProps = { mode: AuthMode; onModeChange: (mode: AuthMode) => void };

export default function Auth({ mode, onModeChange }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => getConfirmationMessage(window.location.search));
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const confirmationRequested = hasConfirmedEmail(window.location.search);

  const signInWithGoogle = async () => {
    setError("");
    setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    setGoogleLoading(true);
    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getConfirmationRedirect(window.location.origin), skipBrowserRedirect: true },
    });
    if (googleError || !data?.url) {
      setError("Google sign-in is not enabled in Supabase yet. In Supabase, open Authentication → Providers → Google, enable it, save the provider settings, and try again.");
      setGoogleLoading(false);
      return;
    }
    window.location.assign(data.url);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const credentials = { email: email.trim(), password };
      let { error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError && /failed to fetch|networkerror|load failed/i.test(signInError.message)) {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        ({ error: signInError } = await supabase.auth.signInWithPassword(credentials));
      }
      if (signInError) throw signInError;
    } catch (cause) {
      const rawMessage = cause instanceof Error ? cause.message : "We could not complete that request.";
      setError(formatAuthError(rawMessage, "login"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art" aria-hidden="true"><div className="auth-art__ring" /><div className="auth-art__ring auth-art__ring--two" /></div>
      <a className="auth-brand" href="/"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><strong>ELIZZY</strong><em>DOMAIN</em></a>
      <main className="auth-layout">
        <section className="auth-intro"><span className="eyebrow eyebrow--blue">PRIVATE PLAYBACK ROOM</span><h1>Your next<br /><i>good signal</i><br />starts here.</h1><p>Save your place, keep your feed personal, and move from account to playback without extra noise.</p><div className="auth-proof"><ShieldCheck size={18} /><span>Secure authentication powered by Supabase Auth.</span></div></section>
        <section className="auth-card">
          <div className="auth-card__top"><span className="auth-card__icon"><UserRound size={19} /></span><span className="eyebrow">{mode === "login" ? "RETURNING VIEWER" : "NEW VIEWER"}</span></div>
          <h2>{mode === "login" ? "Welcome back." : "Create your account."}</h2><p className="auth-card__lead">{mode === "login" ? "Sign in to continue to the live video feed." : "A few details, then your private viewing room is ready."}</p>
          {confirmationRequested && <div className="auth-message auth-message--success" role="status"><ShieldCheck size={16} /><span>Email confirmed. Sign in to continue to your ELIZZY DOMAIN account.</span></div>}
          {mode === "login" ? <><form onSubmit={submit} className="auth-form">
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
            <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}
            {message && <div className="auth-message auth-message--success" role="status"><ShieldCheck size={16} /><span>{message}</span></div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}{busy ? "Working…" : "Enter playback room"}</button>
          </form><div className="auth-google-divider"><span>or</span></div><button className="primary-button auth-google-button" type="button" onClick={() => void signInWithGoogle()} disabled={googleLoading}>{googleLoading ? <LoaderCircle size={17} className="spin" /> : <span className="auth-google-mark">G</span>}{googleLoading ? "Connecting to Google…" : "Sign in with Google"}</button></> : <section className="auth-google-panel" aria-live="polite">
            <p className="auth-google-panel__lead">Create or continue your ELIZZY DOMAIN account with Google. No email-delivery confirmation is required.</p>
            {error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}
            <button className="primary-button auth-google-button" type="button" onClick={() => void signInWithGoogle()} disabled={googleLoading}>{googleLoading ? <LoaderCircle size={17} className="spin" /> : <span className="auth-google-mark">G</span>}{googleLoading ? "Connecting to Google…" : "Continue with Google"}</button>
            <p className="auth-google-panel__note">Google sign-in uses Supabase OAuth and keeps your existing profile and Premium access records.</p>
          </section>}
          <div className="auth-switch"><span>{mode === "login" ? "New to ELIZZY DOMAIN?" : "Already have an account?"}</span><button onClick={() => { setError(""); setMessage(""); onModeChange(mode === "login" ? "signup" : "login"); }}>{mode === "login" ? "Create account" : "Sign in"}</button></div>
          <a className="auth-back" href="/"><ArrowLeft size={14} /> Back to feed</a><a className="auth-feedback" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20feedback">Feedback: elijahchinecheremonah@gmail.com</a>
        </section>
      </main>
    </div>
  );
}
