import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/lib/supabase";
import { formatAuthError } from "@/lib/authErrors";
import { getPasswordResetRedirect, getSignupEmailRedirect } from "@/lib/authRedirect";
import { signupAccessMessage } from "@/lib/signupAccess";
import { validateSignupEmail } from "@/lib/emailPolicy";

export type AuthView = "login" | "signup" | "forgot" | "reset";
type AuthProps = {
  view: AuthView;
  onViewChange: (view: AuthView) => void;
  notice?: string;
  onClearNotice?: () => void;
  recoveryReady?: boolean;
  onPasswordResetComplete?: (message: string) => void;
};

export default function Auth({ view, onViewChange, notice, onClearNotice, recoveryReady = false, onPasswordResetComplete }: AuthProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signupNeedsVerification, setSignupNeedsVerification] = useState(false);

  const isSignup = view === "signup";
  const isForgot = view === "forgot";
  const isReset = view === "reset";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    onClearNotice?.();
    setError("");
    setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    if (!isReset && !email.trim()) {
      setError("Enter the email address connected to your account.");
      return;
    }
    if (isForgot) {
      // Email-only validation is enough for recovery requests.
    } else if (isSignup) {
      const emailPolicy = validateSignupEmail(email);
      if (!emailPolicy.valid) {
        setError(emailPolicy.message);
        return;
      }
      if (fullName.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
    } else if (isReset) {
      if (!recoveryReady) {
        setError("This reset link is invalid or expired. Request a new password reset email.");
        return;
      }
      if (password.length < 6) {
        setError("Your password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Your passwords do not match yet.");
        return;
      }
    } else if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: getSignupEmailRedirect(),
          },
        });
        if (signUpError) throw signUpError;
        setSignupNeedsVerification(!Boolean(data.session));
        setMessage(signupAccessMessage(Boolean(data.session), email.trim()));
        setPassword("");
        setConfirmPassword("");
      } else if (isForgot) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getPasswordResetRedirect(),
        });
        if (resetError) throw resetError;
        setMessage(`If an account exists for ${email.trim()}, a password reset link has been sent.`);
      } else if (isReset) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        await supabase.auth.signOut();
        setPassword("");
        setConfirmPassword("");
        onPasswordResetComplete?.("Password updated. Sign in with your new password.");
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
      setError(formatAuthError(rawMessage, isSignup || isForgot ? "signup" : "login"));
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    onClearNotice?.();
    setError("");
    setMessage("");
    if (!supabase || !isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    if (!email.trim()) {
      setError("Enter the same email address you used to sign up.");
      return;
    }
    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: getSignupEmailRedirect() },
      });
      if (resendError) throw resendError;
      setMessage(`A new verification link was sent to ${email.trim()}. Check your inbox and spam folder.`);
    } catch (cause) {
      const rawMessage = cause instanceof Error ? cause.message : "We could not complete that request.";
      setError(formatAuthError(rawMessage, "signup"));
    } finally {
      setBusy(false);
    }
  };

  const switchView = (nextView: AuthView) => {
    onClearNotice?.();
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
    setSignupNeedsVerification(false);
    onViewChange(nextView);
  };

  const title = isReset ? "Set a new password." : isForgot ? "Reset your password." : view === "login" ? "Welcome back." : "Create your account.";
  const lead = isReset
    ? "Choose a new password for your account, then return to sign in."
    : isForgot
      ? "Enter the email connected to your account and we will send a reset link."
      : view === "login"
        ? "Sign in to continue to the live video feed."
        : "A few details, then check your inbox to verify your email.";
  const eyebrow = isReset ? "SECURE RESET" : isForgot ? "ACCOUNT RECOVERY" : view === "login" ? "RETURNING VIEWER" : "NEW VIEWER";
  const statusMessage = message || notice;
  const canResendVerification = isSignup && signupNeedsVerification && Boolean(email.trim()) && !busy;
  const submitLabel = isReset ? "Save new password" : isForgot ? "Send reset link" : view === "login" ? "Enter playback room" : "Create account";
  const submitBusyLabel = isReset ? "Updating password…" : isForgot ? "Sending reset link…" : view === "login" ? "Checking your secure sign-in…" : "Creating your account…";

  return (
    <div className="auth-shell">
      <div className="auth-art" aria-hidden="true"><div className="auth-art__ring" /><div className="auth-art__ring auth-art__ring--two" /></div>
      <a className="auth-brand" href="/"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><strong>ELIZZY</strong><em>DOMAIN</em></a>
      <main className="auth-layout">
        <section className="auth-intro"><span className="eyebrow eyebrow--blue">PRIVATE PLAYBACK ROOM</span><h1>Your next<br /><i>good signal</i><br />starts here.</h1><p>Save your place, keep your feed personal, and move from account to playback without extra noise.</p><div className="auth-proof"><ShieldCheck size={18} /><span>Secure authentication powered by Supabase Auth.</span></div></section>
        <section className="auth-card">
          <div className="auth-card__top"><span className="auth-card__icon"><UserRound size={19} /></span><span className="eyebrow">{eyebrow}</span></div>
          <h2>{title}</h2><p className="auth-card__lead">{lead}</p>
          <form onSubmit={submit} className="auth-form">
            {isSignup && <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ada Lovelace" autoComplete="name" required /></label>}
            {!isReset && <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>}
            {!isForgot && (
              <label>Password<div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={view === "login" ? "current-password" : "new-password"} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            )}
            {isReset && <label>Confirm new password<div className="password-field"><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your new password" autoComplete="new-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
            {error && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>{error}</span></div>}
            {busy && <div className="auth-progress" role="status" aria-live="polite"><LoaderCircle size={17} className="spin" /><span>{submitBusyLabel}</span></div>}
            {statusMessage && <div className={`auth-message ${signupNeedsVerification ? "auth-message--signup-success" : "auth-message--success"}`} role="status"><ShieldCheck size={16} /><span>{statusMessage}</span>{canResendVerification && <button type="button" className="auth-message__action" onClick={resendVerification}>Resend link</button>}</div>}
            {!recoveryReady && isReset && <div className="auth-message auth-message--error"><CircleAlert size={16} /><span>This recovery session is not active. Request a new password reset email to continue.</span></div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy || (isReset && !recoveryReady)}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}{busy ? "Working…" : submitLabel}</button>
          </form>
          {view === "login" && <button type="button" className="auth-forgot-link" onClick={() => switchView("forgot")}>Forgot password?</button>}
          {view === "signup" && <div className="auth-switch"><span>Already have an account?</span><button onClick={() => switchView("login")}>Sign in</button></div>}
          {view === "login" && <div className="auth-switch"><span>New to ELIZZY DOMAIN?</span><button onClick={() => switchView("signup")}>Create account</button></div>}
          {view === "forgot" && <div className="auth-switch"><span>Remembered your password?</span><button onClick={() => switchView("login")}>Back to sign in</button></div>}
          {view === "reset" && <div className="auth-switch"><span>Need a fresh recovery email?</span><button onClick={() => switchView("forgot")}>Request reset link</button></div>}
          <a className="auth-back" href="/"><ArrowLeft size={14} /> Back to feed</a><a className="auth-feedback" href="mailto:elijahchinecheremonah@gmail.com?subject=Eliminator%20feedback">Feedback: elijahchinecheremonah@gmail.com</a>
        </section>
      </main>
    </div>
  );
}
