/* Coastal Signal app shell: auth is the doorway, playback is the protected room, and session transitions stay explicit. */
import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import PremiumAdmin from "./pages/PremiumAdmin";
import PremiumRoom from "./pages/PremiumRoom";
import Auth from "./pages/Auth";
import Maintenance from "./pages/Maintenance";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";
import { isAccountSuspended, isAccountWarningExpired } from "@/lib/accountManagement";
import { isPremiumCurrentlyActive } from "@/lib/premiumDuration";
import type { Session, User } from "@supabase/supabase-js";
import { hasConfirmedEmail } from "@/lib/authRedirect";
import { hasRecoverySessionHash } from "@/lib/passwordRecovery";
import { isApprovedAdminEmail } from "@/lib/adminAccess";

function getAuthMode(): "login" | "signup" | "forgot" | "reset" {
  const mode = new URLSearchParams(window.location.search).get("mode");
  if (mode === "signup" || mode === "forgot" || mode === "reset") return mode;
  return hasRecoverySessionHash(window.location.hash) ? "reset" : "login";
}

type VerificationReturnProps = {
  status: "processing" | "success";
  authenticated: boolean;
  onContinue: () => void;
};

function VerificationReturn({ status, authenticated, onContinue }: VerificationReturnProps) {
  const isProcessing = status === "processing";
  return (
    <main className={`verification-return ${isProcessing ? "verification-return--processing" : "verification-return--success"}`}>
      <div className="verification-return__glow verification-return__glow--one" aria-hidden="true" />
      <div className="verification-return__glow verification-return__glow--two" aria-hidden="true" />
      <section className="verification-return__card" aria-live="polite" aria-busy={isProcessing}>
        <a className="verification-return__brand" href="/" aria-label="Return to Eliminator home"><span className="brand-mark"><span className="signal-mark"><span /><span /><span /></span></span><strong>eliminator</strong><em>streaming</em></a>
        <div className={`verification-return__icon ${isProcessing ? "verification-return__icon--loading" : "verification-return__icon--success"}`}>
          {isProcessing ? <LoaderCircle size={30} className="spin" aria-hidden="true" /> : <CheckCircle2 size={32} aria-hidden="true" />}
        </div>
        <span className="eyebrow eyebrow--blue">{isProcessing ? "SECURE CHECK" : "ACCOUNT READY"}</span>
        <h1>{isProcessing ? "Confirming your email…" : "Email verified successfully."}</h1>
        <p>{isProcessing ? "We’re securely processing your verification and preparing the right next step. This usually takes only a moment." : authenticated ? "Your verified session is ready. Continue to your Eliminator streaming room." : "Your email is confirmed. Sign in with your password to enter your Eliminator account."}</p>
        <div className="verification-return__status"><ShieldCheck size={16} /><span>{isProcessing ? "Checking your secure session" : authenticated ? "Verified and signed in" : "Verified — sign-in required"}</span></div>
        {!isProcessing && <button className="primary-button verification-return__action" type="button" onClick={onContinue}>{authenticated ? "Continue to Eliminator" : "Continue to sign in"}</button>}
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot" | "reset">(getAuthMode);
  const [showProfile, setShowProfile] = useState(() => new URLSearchParams(window.location.search).get("profile") === "1");
  const [showPricing, setShowPricing] = useState(() => new URLSearchParams(window.location.search).get("pricing") === "1");
  const [showAdmin, setShowAdmin] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showPremium, setShowPremium] = useState(() => new URLSearchParams(window.location.search).get("premium") === "1");
  const [premiumActive, setPremiumActive] = useState(false);
  const confirmedEmailReturn = hasConfirmedEmail(window.location.search) && getAuthMode() !== "reset";
  const maintenanceMode = false;

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }
    const resolveSession = async (nextSession: Session | null) => {
      if (!nextSession?.user) {
        setSession(null);
        setPremiumActive(false);
        return;
      }
      const [{ data: profile, error: profileError }, { data: entitlement }] = await Promise.all([
        supabase.from("profiles").select("account_status, account_warning, account_warning_started_at").eq("id", nextSession.user.id).maybeSingle(),
        supabase.from("premium_entitlements").select("active, expires_at").eq("user_id", nextSession.user.id).maybeSingle(),
      ]);
      const isApprovedAdmin = isApprovedAdminEmail(nextSession.user.email);
      if (!profileError && !profile && !isApprovedAdmin) {
        await supabase.auth.signOut();
        window.history.replaceState({}, "", "/?mode=login&deleted=1");
        setSession(null);
        setPremiumActive(false);
        return;
      }
      if (isAccountSuspended(profile?.account_status) || (profile?.account_warning && isAccountWarningExpired(profile.account_warning_started_at))) {
        const warningExpired = Boolean(profile?.account_warning && isAccountWarningExpired(profile.account_warning_started_at));
        await supabase.auth.signOut();
        window.history.replaceState({}, "", warningExpired ? "/?mode=login&warning_expired=1" : "/?mode=login&suspended=1");
        setSession(null);
        setPremiumActive(false);
        return;
      }
      setSession(nextSession);
      setPremiumActive(isPremiumCurrentlyActive(Boolean(entitlement?.active), entitlement?.expires_at) || hasPermanentPremiumAccess(nextSession.user.email));
    };
    let active = true;
    const refreshSessionStatus = async () => {
      const { data } = await supabase.auth.getSession();
      if (active && data.session) await resolveSession(data.session);
    };
    supabase.auth.getSession().then(async ({ data }) => {
      await resolveSession(data.session);
      if (active) {
        setVerificationComplete(confirmedEmailReturn);
        setCheckingAuth(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await resolveSession(nextSession);
      if (active) {
        setVerificationComplete(confirmedEmailReturn);
        setCheckingAuth(false);
      }
    });
    const statusInterval = window.setInterval(() => void refreshSessionStatus(), 15000);
    const handleResume = () => void refreshSessionStatus();
    window.addEventListener("focus", handleResume);
    document.addEventListener("visibilitychange", handleResume);
    return () => {
      active = false;
      window.clearInterval(statusInterval);
      window.removeEventListener("focus", handleResume);
      document.removeEventListener("visibilitychange", handleResume);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  const goToProfile = () => {
    window.history.pushState({}, "", "/?profile=1");
    setShowProfile(true); setShowPricing(false); setShowAdmin(false); setShowPremium(false);
  };

  const goToPricing = () => {
    window.history.pushState({}, "", "/?pricing=1");
    setShowPricing(true); setShowProfile(false); setShowAdmin(false);
  };

  const goToAdmin = () => {
    window.history.pushState({}, "", "/?admin=1");
    setShowAdmin(true); setShowPricing(false); setShowProfile(false); setShowPremium(false);
  };

  const goToPremium = () => {
    window.history.pushState({}, "", "/?premium=1");
    setShowPremium(true); setShowAdmin(false); setShowPricing(false); setShowProfile(false);
  };

  const goToFeed = () => {
    window.history.pushState({}, "", "/");
    setShowProfile(false); setShowPricing(false); setShowAdmin(false); setShowPremium(false);
  };

  if (maintenanceMode) return <Maintenance />;

  const continueAfterVerification = () => {
    const nextPath = session?.user ? "/" : "/?mode=login";
    window.history.replaceState({}, "", nextPath);
    setVerificationComplete(false);
    if (!session?.user) setAuthMode("login");
  };

  if (checkingAuth) {
    return confirmedEmailReturn ? <VerificationReturn status="processing" authenticated={false} onContinue={continueAfterVerification} /> : <div className="auth-loading"><span className="signal-mark"><span /><span /><span /></span><p>Tuning into your session…</p></div>;
  }

    if (confirmedEmailReturn && verificationComplete) {
    return <VerificationReturn status="success" authenticated={Boolean(session?.user)} onContinue={continueAfterVerification} />;
  }
  if (authMode === "reset") {
    return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Auth mode="reset" onModeChange={(mode) => { setAuthMode(mode); window.history.replaceState({}, "", `/?mode=${mode}`); }} /></TooltipProvider></ThemeProvider></ErrorBoundary>;
  }
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster />{showPricing ? <Pricing user={session?.user} onBack={goToFeed} /> : session?.user ? (showAdmin ? <PremiumAdmin user={session.user} onBack={goToFeed} onSignOut={signOut} /> : showPremium ? <PremiumRoom user={session.user} isPremium={premiumActive} onBack={goToFeed} onPricing={goToPricing} onSignOut={signOut} /> : showProfile ? <Profile user={session.user} onBack={goToFeed} onSignOut={signOut} /> : <Home user={session.user} onProfile={goToProfile} onPricing={goToPricing} onPremium={goToPremium} onAdmin={goToAdmin} onSignOut={signOut} />) : <Auth mode={authMode} onModeChange={(mode) => { setAuthMode(mode); window.history.replaceState({}, "", `/?mode=${mode}`); }} />}</TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export type AppUser = User;
