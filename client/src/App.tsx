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
import ToolHub from "./pages/ToolHub";
import Auth from "./pages/Auth";
import Maintenance from "./pages/Maintenance";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";
import type { Session, User } from "@supabase/supabase-js";
import { hasConfirmedEmail } from "@/lib/authRedirect";

function getAuthMode() {
  return new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login";
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
  const [authMode, setAuthMode] = useState<"login" | "signup">(getAuthMode);
  const [showProfile, setShowProfile] = useState(() => new URLSearchParams(window.location.search).get("profile") === "1");
  const [showPricing, setShowPricing] = useState(() => new URLSearchParams(window.location.search).get("pricing") === "1");
  const [showAdmin, setShowAdmin] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showPremium, setShowPremium] = useState(() => new URLSearchParams(window.location.search).get("premium") === "1");
  const [showTools, setShowTools] = useState(() => new URLSearchParams(window.location.search).get("tools") === "1");
  const [premiumActive, setPremiumActive] = useState(false);
  const publicToolsRequested = new URLSearchParams(window.location.search).get("tools") === "1";
  const confirmedEmailReturn = hasConfirmedEmail(window.location.search);
  const maintenanceMode = false;

  useEffect(() => {
    if (publicToolsRequested) {
      setCheckingAuth(false);
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        const { data: entitlement } = await supabase.from("premium_entitlements").select("active").eq("user_id", data.session.user.id).maybeSingle();
        setPremiumActive(Boolean(entitlement?.active) || hasPermanentPremiumAccess(data.session.user.email));
      }
      setVerificationComplete(confirmedEmailReturn);
      setCheckingAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        const { data: entitlement } = await supabase.from("premium_entitlements").select("active").eq("user_id", nextSession.user.id).maybeSingle();
        setPremiumActive(Boolean(entitlement?.active) || hasPermanentPremiumAccess(nextSession.user.email));
      } else setPremiumActive(false);
      setVerificationComplete(confirmedEmailReturn);
      setCheckingAuth(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  const goToProfile = () => {
    window.history.pushState({}, "", "/?profile=1");
    setShowProfile(true); setShowPricing(false); setShowAdmin(false); setShowPremium(false); setShowTools(false);
  };

  const goToPricing = () => {
    window.history.pushState({}, "", "/?pricing=1");
    setShowPricing(true); setShowProfile(false); setShowAdmin(false); setShowTools(false);
  };

  const goToAdmin = () => {
    window.history.pushState({}, "", "/?admin=1");
    setShowAdmin(true); setShowPricing(false); setShowProfile(false); setShowPremium(false); setShowTools(false);
  };

  const goToPremium = () => {
    window.history.pushState({}, "", "/?premium=1");
    setShowPremium(true); setShowAdmin(false); setShowPricing(false); setShowProfile(false); setShowTools(false);
  };

  const goToTools = () => {
    window.history.pushState({}, "", "/?tools=1");
    setShowTools(true); setShowProfile(false); setShowPricing(false); setShowAdmin(false); setShowPremium(false);
  };

  const goToFeed = () => {
    window.history.pushState({}, "", "/");
    setShowProfile(false); setShowPricing(false); setShowAdmin(false); setShowPremium(false); setShowTools(false);
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

  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster />{showPricing ? <Pricing user={session?.user} onBack={goToFeed} /> : (showTools || publicToolsRequested) ? <ToolHub user={session?.user} onBack={goToFeed} onSignOut={signOut} /> : session?.user ? (showAdmin ? <PremiumAdmin user={session.user} onBack={goToFeed} onSignOut={signOut} /> : showPremium ? <PremiumRoom user={session.user} isPremium={premiumActive} onBack={goToFeed} onPricing={goToPricing} onSignOut={signOut} /> : showProfile ? <Profile user={session.user} onBack={goToFeed} onSignOut={signOut} /> : <Home user={session.user} onProfile={goToProfile} onPricing={goToPricing} onPremium={goToPremium} onAdmin={goToAdmin} onTools={goToTools} onSignOut={signOut} />) : <Auth mode={authMode} onModeChange={(mode) => { setAuthMode(mode); window.history.replaceState({}, "", `/?mode=${mode}`); }} />}</TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export type AppUser = User;
