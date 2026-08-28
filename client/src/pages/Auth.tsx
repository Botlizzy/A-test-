import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/lib/supabase";
import { formatAuthError } from "@/lib/authErrors";
import { isValidSignupCode, sanitizeSignupCode, signupVerificationMessage, signupVerificationResentMessage, signupVerificationSuccessMessage } from "@/lib/signupVerification";

type AuthMode = "login" | "signup";
type AuthProps = { mode: AuthMode; onModeChange: (mode: AuthMode) => void };

export default function Auth({ mode, onModeChange }: AuthProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const verifySignupCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    if (!isValidSignupCode(verificationCode)) {
      setError("Enter the six-digit code from your ELIZZY DOMAIN email.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email: pendingVerificationEmail, token: verificationCode, type: "signup" });
      if (verifyError) throw verifyError;
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName.trim(), email: pendingVerificationEmail });
      }
      setPendingVerificationEmail("");
      setVerificationCode("");
      setMessage(signupVerificationSuccessMessage());
    } catch (cause) {
      const rawMessage = cause instanceof Error ? cause.message : "We could not verify that code.";
      setError(formatAuthError(rawMessage, "signup"));
    } finally {
      setBusy(false);
    }
  };

  const resendSignupCode = async () => {
    if (!supabase || !pendingVerificationEmail) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email: pendingVerificationEmail });
      if (resendError) throw resendError;
      setMessage(signupVerificationResentMessage());
    } catch (cause) {
      const rawMessage = cause instanceof Error ? cause.message : "We could not resend the verification code.";
      setError(formatAuthError(rawMessage, "signup"));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    if (!email.trim()) {
      setError("Enter the email address connected to your account.");
      return;
    }
    if (mode === "signup") {
      if (fullName.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
    } else if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signUpError) throw signUpError;
        if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName.trim(), email: email.trim() });
        if (data.session) {
          setMessage("Signup successful. Your account is ready and you are signed in.");
        } else {
          setPendingVerificationEmail(email.trim());
          setMessage(signupVerificationMessage(email.trim()));
        }
        setPassword("");
      } else {
        const credentials = { email: email.trim(), password };
        let { error: signInError } = await supabase.auth.signInWithPassword(credentials);
        if (signInError && /failed to fetch|networkerror|load failed/i.test(signInError.message)) {
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          ({ error: signInError } = await supabase.auth.signInWithPassword(credentials));
        }
        if (signInError) throw signInError;
      }
    } catch (cause) {
      const rawMessage = cause instanceof Error ? cause.message : "We could not complete that request.";
      setError(formatAuthError(rawMessage, mode === "signup" ? "signup" : "login"));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setError("");
    setPassword("");
    onModeChange(nextMode);
    window.history.replaceState({}, "", `/?mode=${nextMode}`);
  };

  const title = mode === "login" ? "Welcome back." : "Create your account.";
  const lead = mode === "login" ? "Sign in to continue to the live video feed." : "A few details, then your private viewing room is ready.";
  const eyebrow = mode === "login" ? "RETURNING VIEWER" : "NEW VIEWER";

  return (
    <div className="auth-shell">
      <div className="auth-art" aria-hidden="true"><div className="auth-art__ring" /><div className="auth-art__ring auth-art__ring--two" /></div>
      <a className="auth-brand" href="/"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><strong>ELIZZY</strong><em>DOMAIN</em></a>
      <main className="auth-layout">
        <section className="auth-intro"><span className="eyebrow eyebrow--blue">PRIVATE PLAYBACK ROOM</span><h1>Your next<br /><i>good signal</i><br />starts here.</h1><p>Save your place, keep your feed personal, and move from account to playback without extra noise.</p><div className="auth-proof"><ShieldCheck size={18} /><span>Secure authentication powered by Supabase Auth.</span></div></section>
        <section className="auth-card">
          <div className="auth-card__top"><span className="auth-card__icon"><UserRound size={19} /></span><span className="eyebrow">{eyebrow}</span></div>
          <h2>{title}</h2><p className="auth-card__lead">{lead}</p>
          {pendingVerificationEmail ? <form onSubmit={verifySignupCode} className="auth-form">
            <label>Verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(sanitizeSignupCode(event.target.value))} placeholder="123456" autoComplete="one-time-code" required /></label>
            {error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}
            {busy && <div className="auth-progress" role="status" aria-live="polite"><LoaderCircle size={17} className="spin" /><span>Verifying your code…</span></div>}
            {message && <div className="auth-message auth-message--success" role="status"><ShieldCheck size={16} /><span>{message}</span></div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <ShieldCheck size={17} />} {busy ? "Verifying…" : "Verify code"}</button>
            <button className="auth-forgot-link" type="button" onClick={() => void resendSignupCode()} disabled={busy}>Resend code</button>
          </form> : <form onSubmit={submit} className="auth-form">
            {mode === "signup" && <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ada Lovelace" autoComplete="name" required /></label>}
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
            <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}
            {busy && <div className="auth-progress" role="status" aria-live="polite"><LoaderCircle size={17} className="spin" /><span>{mode === "signup" ? "Creating your account…" : "Checking your secure sign-in…"}</span></div>}
            {message && <div className="auth-message auth-message--success" role="status"><ShieldCheck size={16} /><span>{message}</span></div>}
            {mode === "signup" && <p className="auth-scale-note">After signup, enter the six-digit code sent from **ELIZZY DOMAIN** to activate your account.</p>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}{busy ? "Working…" : mode === "login" ? "Enter playback room" : "Create account"}</button>
          </form>}
          {(mode === "login" || mode === "signup") && <div className="auth-switch"><span>{mode === "login" ? "New to ELIZZY DOMAIN?" : "Already have an account?"}</span><button onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></div>}
          <a className="auth-back" href="/"><ArrowLeft size={14} /> Back to feed</a><a className="auth-feedback" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20feedback">Feedback: elijahchinecheremonah@gmail.com</a>
        </section>
      </main>
    </div>
  );
}
