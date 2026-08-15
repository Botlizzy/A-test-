/* Coastal Signal auth: calm, high-contrast entry screens that keep the primary action obvious and the source boundary visible. */
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/lib/supabase";
import { getConfirmationMessage, getConfirmationRedirect } from "@/lib/authRedirect";

type AuthMode = "login" | "signup";

type AuthProps = { mode: AuthMode; onModeChange: (mode: AuthMode) => void };

export default function Auth({ mode, onModeChange }: AuthProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => getConfirmationMessage(window.location.search));
  const [error, setError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setRateLimited(false);
    if (cooldownSeconds > 0 && mode === "signup") {
      setError(`Signup email delivery is cooling down. Please wait ${cooldownSeconds} seconds before trying again, or use Sign in if you already received a confirmation email.`);
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    if (mode === "signup" && fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const confirmationRedirect = getConfirmationRedirect(window.location.origin);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: confirmationRedirect,
            data: { full_name: fullName.trim() },
          },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName.trim(), email: email.trim() });
        }
        setMessage("Account created. Check your email if confirmation is enabled, then sign in.");
        setPassword("");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      }
    } catch (cause) {
      const rawMessage = cause instanceof Error ? cause.message : "We could not complete that request.";
      const isRateLimited = /rate limit|too many requests|over_email_send_rate_limit|429/i.test(rawMessage);
      if (isRateLimited && mode === "signup") {
        setCooldownSeconds(60);
        setRateLimited(true);
        setError("Supabase has temporarily limited confirmation emails. Wait a few minutes before retrying. If an email already arrived, use Sign in instead. This is a provider limit, not a problem with your account details.");
      } else setError(rawMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art" aria-hidden="true"><div className="auth-art__ring" /><div className="auth-art__ring auth-art__ring--two" /></div>
      <a className="auth-brand" href="/"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><strong>eliminator</strong><em>streaming</em></a>
      <main className="auth-layout">
        <section className="auth-intro"><span className="eyebrow eyebrow--blue">PRIVATE PLAYBACK ROOM</span><h1>Your next<br /><i>good signal</i><br />starts here.</h1><p>Save your place, keep your feed personal, and move from account to playback without extra noise.</p><div className="auth-proof"><ShieldCheck size={18} /><span>Secure authentication powered by Supabase Auth.</span></div></section>
        <section className="auth-card">
          <div className="auth-card__top"><span className="auth-card__icon"><UserRound size={19} /></span><span className="eyebrow">{mode === "login" ? "RETURNING VIEWER" : "NEW VIEWER"}</span></div>
          <h2>{mode === "login" ? "Welcome back." : "Create your account."}</h2><p className="auth-card__lead">{mode === "login" ? "Sign in to continue to the live video feed." : "A few details, then your private viewing room is ready."}</p>
          <form onSubmit={submit} className="auth-form">
            {mode === "signup" && <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ada Lovelace" autoComplete="name" required /></label>}
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
            <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}
            {message && <div className="auth-message auth-message--success"><ShieldCheck size={16} /><span>{message}</span></div>}
            {mode === "signup" && cooldownSeconds > 0 && <p className="auth-cooldown">Try again in <strong>{cooldownSeconds}s</strong>. Repeated requests can extend the provider cooldown.</p>}
            {rateLimited && <div className="auth-recovery-actions"><button type="button" onClick={() => { setRateLimited(false); setCooldownSeconds(0); setError(""); onModeChange("login"); }}>Use Sign in instead</button>{cooldownSeconds === 0 && <button type="button" onClick={() => { setRateLimited(false); setError(""); }}>Try signup again</button>}</div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy || (mode === "signup" && cooldownSeconds > 0)}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}{busy ? "Working…" : cooldownSeconds > 0 && mode === "signup" ? "Email cooldown active" : mode === "login" ? "Enter playback room" : "Create account"}</button>
          </form>
          <div className="auth-switch"><span>{mode === "login" ? "New to Eliminator?" : "Already have an account?"}</span><button onClick={() => { setError(""); setMessage(""); setRateLimited(false); setCooldownSeconds(0); onModeChange(mode === "login" ? "signup" : "login"); }}>{mode === "login" ? "Create account" : "Sign in"}</button></div>
          <a className="auth-back" href="/"><ArrowLeft size={14} /> Back to feed</a><a className="auth-feedback" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20feedback">Feedback: elijahchinecheremonah@gmail.com</a>
        </section>
      </main>
    </div>
  );
}
