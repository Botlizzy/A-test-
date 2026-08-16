import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/lib/supabase";
import { getConfirmationMessage, getConfirmationRedirect, hasConfirmedEmail } from "@/lib/authRedirect";
import { formatAuthError, formatSignupSuccess } from "@/lib/authErrors";
import { getPasswordResetRedirect, validatePasswordReset } from "@/lib/passwordRecovery";

type AuthMode = "login" | "signup" | "forgot" | "reset";
type AuthProps = { mode: AuthMode; onModeChange: (mode: AuthMode) => void };

export default function Auth({ mode, onModeChange }: AuthProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => { const params = new URLSearchParams(window.location.search); if (params.get("suspended") === "1") return "This account has been suspended by an administrator. Contact support if you believe this is a mistake."; if (params.get("warning_expired") === "1") return "Your five-minute warning access window has ended, so you have been signed out. Contact support if you need help."; return getConfirmationMessage(window.location.search); });
  const [error, setError] = useState("");
  const [resetComplete, setResetComplete] = useState(false);
  const confirmationRequested = hasConfirmedEmail(window.location.search);
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    if ((isForgot || mode === "login") && !email.trim()) {
      setError("Enter the email address connected to your account.");
      return;
    }
    if (isReset) {
      const resetValidationError = validatePasswordReset(password, confirmPassword);
      if (resetValidationError) {
        setError(resetValidationError);
        return;
      }
    } else if (mode === "signup") {
      if (fullName.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
    } else if (!isForgot && password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (isForgot) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getPasswordResetRedirect(getConfirmationRedirect(window.location.origin)) });
        if (resetError) throw resetError;
        setMessage("If an account uses this email, a secure password-reset link is on its way. Check your inbox and spam folder.");
      } else if (isReset) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setPassword("");
        setConfirmPassword("");
        setMessage("Your password was updated securely. You can now sign in with the new password.");
        setResetComplete(true);
      } else if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: getConfirmationRedirect(window.location.origin), data: { full_name: fullName.trim() } },
        });
        if (signUpError) throw signUpError;
        if (data.user) await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName.trim(), email: email.trim() });
        setMessage(formatSignupSuccess(Boolean(data.session)));
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
    setMessage("");
    setResetComplete(false);
    setPassword("");
    setConfirmPassword("");
    onModeChange(nextMode);
    window.history.replaceState({}, "", `/?mode=${nextMode}`);
  };

  const title = isForgot ? "Reset your password." : isReset ? "Choose a new password." : mode === "login" ? "Welcome back." : "Create your account.";
  const lead = isForgot ? "Enter your email and we’ll send a secure reset link." : isReset ? "Create a new password for your ELIZZY DOMAIN account." : mode === "login" ? "Sign in to continue to the live video feed." : "A few details, then your private viewing room is ready.";
  const eyebrow = isForgot || isReset ? "ACCOUNT RECOVERY" : mode === "login" ? "RETURNING VIEWER" : "NEW VIEWER";

  return (
    <div className="auth-shell">
      <div className="auth-art" aria-hidden="true"><div className="auth-art__ring" /><div className="auth-art__ring auth-art__ring--two" /></div>
      <a className="auth-brand" href="/"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><strong>ELIZZY</strong><em>DOMAIN</em></a>
      <main className="auth-layout">
        <section className="auth-intro"><span className="eyebrow eyebrow--blue">PRIVATE PLAYBACK ROOM</span><h1>Your next<br /><i>good signal</i><br />starts here.</h1><p>Save your place, keep your feed personal, and move from account to playback without extra noise.</p><div className="auth-proof"><ShieldCheck size={18} /><span>Secure authentication powered by Supabase Auth.</span></div></section>
        <section className="auth-card">
          <div className="auth-card__top"><span className="auth-card__icon"><UserRound size={19} /></span><span className="eyebrow">{eyebrow}</span></div>
          <h2>{title}</h2><p className="auth-card__lead">{lead}</p>
          {confirmationRequested && <div className="auth-message auth-message--success" role="status"><ShieldCheck size={16} /><span>Email confirmed. Sign in to continue to your ELIZZY DOMAIN account.</span></div>}
          {resetComplete ? <div className="auth-reset-complete" role="status"><div className="auth-reset-complete__icon"><ShieldCheck size={24} /></div><h3>Password updated</h3><p>Your new password is ready. Return to sign in and use it to enter your private viewing room.</p><button className="primary-button auth-submit" type="button" onClick={() => switchMode("login")}><ArrowRight size={17} /> Continue to sign in</button></div> : <form onSubmit={submit} className="auth-form">
            {mode === "signup" && <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ada Lovelace" autoComplete="name" required /></label>}
            {!isReset && <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>}
            {!isForgot && <label>{isReset ? "New password" : "Password"}<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isReset ? "At least 8 characters" : "At least 6 characters"} autoComplete={isReset ? "new-password" : mode === "login" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
            {isReset && <label>Confirm new password<div className="password-field"><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" autoComplete="new-password" required /></div></label>}
            {error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}
            {busy && <div className="auth-progress" role="status" aria-live="polite"><LoaderCircle size={17} className="spin" /><span>{isForgot ? "Preparing your secure reset email…" : isReset ? "Updating your password securely…" : mode === "signup" ? "Creating your account and preparing confirmation…" : "Checking your secure sign-in…"}</span></div>}
            {message && <div className="auth-message auth-message--success" role="status"><ShieldCheck size={16} /><span>{message}</span></div>}
            {mode === "signup" && <p className="auth-scale-note">Unlimited member records are supported by the app. Email confirmation delivery is controlled by your Supabase plan and SMTP provider.</p>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}{busy ? "Working…" : isForgot ? "Send reset link" : isReset ? "Update password" : mode === "login" ? "Enter playback room" : "Create account"}</button>
          </form>}
          {mode === "login" && <button className="auth-forgot-link" type="button" onClick={() => switchMode("forgot")}>Forgot password?</button>}
          {(mode === "login" || mode === "signup") && <div className="auth-switch"><span>{mode === "login" ? "New to ELIZZY DOMAIN?" : "Already have an account?"}</span><button onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></div>}
          {(isForgot || isReset) && <button className="auth-forgot-link" type="button" onClick={() => switchMode("login")}>Back to sign in</button>}
          <a className="auth-back" href="/"><ArrowLeft size={14} /> Back to feed</a><a className="auth-feedback" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20feedback">Feedback: elijahchinecheremonah@gmail.com</a>
        </section>
      </main>
    </div>
  );
}
