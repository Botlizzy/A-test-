/* Coastal Signal app shell: auth is the doorway, playback is the protected room, and session transitions stay explicit. */
import { useEffect, useState } from "react";
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
import type { AuthView } from "./pages/Auth";
import Maintenance from "./pages/Maintenance";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";
import { isAccountSuspended, isAccountWarningExpired } from "@/lib/accountManagement";
import { isPremiumCurrentlyActive } from "@/lib/premiumDuration";
import type { Session, User } from "@supabase/supabase-js";

function getAuthView(): AuthView {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") === "1") return "reset";
  if (params.get("forgot") === "1") return "forgot";
  return params.get("mode") === "signup" ? "signup" : "login";
}

function getAuthNotice() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("confirmed") === "1") {
    return "Email verified. Sign in to enter your account.";
  }
  if (params.get("reset_done") === "1") {
    return "Password updated. Sign in with your new password.";
  }
  if (params.get("warning_expired") === "1") {
    return "Your account warning has expired this session. Sign in again to continue if your access was restored.";
  }
  if (params.get("suspended") === "1") {
    return "Your account is suspended. Contact support if you believe this is a mistake.";
  }
  return "";
}

function getAuthPath(view: AuthView) {
  if (view === "signup") return "/?mode=signup";
  if (view === "forgot") return "/?forgot=1";
  if (view === "reset") return "/?reset=1";
  return "/?mode=login";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authView, setAuthView] = useState<AuthView>(getAuthView);
  const [authNotice, setAuthNotice] = useState(getAuthNotice);
  const [showProfile, setShowProfile] = useState(() => new URLSearchParams(window.location.search).get("profile") === "1");
  const [showPricing, setShowPricing] = useState(() => new URLSearchParams(window.location.search).get("pricing") === "1");
  const [showAdmin, setShowAdmin] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showPremium, setShowPremium] = useState(() => new URLSearchParams(window.location.search).get("premium") === "1");
  const [premiumActive, setPremiumActive] = useState(false);
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
      const [{ data: profile }, { data: entitlement }] = await Promise.all([
        supabase.from("profiles").select("account_status, account_warning, account_warning_started_at").eq("id", nextSession.user.id).maybeSingle(),
        supabase.from("premium_entitlements").select("active, expires_at").eq("user_id", nextSession.user.id).maybeSingle(),
      ]);
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
        setCheckingAuth(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthView("reset");
        setAuthNotice("");
        window.history.replaceState({}, "", getAuthPath("reset"));
      }
      await resolveSession(nextSession);
      if (active) {
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

  const goToAuthView = (view: AuthView) => {
    setAuthView(view);
    if (view !== "reset") setAuthNotice("");
    window.history.replaceState({}, "", getAuthPath(view));
  };

  const handlePasswordResetComplete = (message: string) => {
    setAuthNotice(message);
    setAuthView("login");
    window.history.replaceState({}, "", "/?mode=login&reset_done=1");
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

  if (checkingAuth) {
    return <div className="auth-loading"><span className="signal-mark"><span /><span /><span /></span><p>Tuning into your session…</p></div>;
  }

  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster />{showPricing ? <Pricing user={session?.user} onBack={goToFeed} /> : authView === "reset" ? <Auth view={authView} notice={authNotice} recoveryReady={Boolean(session?.user)} onClearNotice={() => setAuthNotice("")} onPasswordResetComplete={handlePasswordResetComplete} onViewChange={goToAuthView} /> : session?.user ? (showAdmin ? <PremiumAdmin user={session.user} onBack={goToFeed} onSignOut={signOut} /> : showPremium ? <PremiumRoom user={session.user} isPremium={premiumActive} onBack={goToFeed} onPricing={goToPricing} onSignOut={signOut} /> : showProfile ? <Profile user={session.user} onBack={goToFeed} onSignOut={signOut} /> : <Home user={session.user} onProfile={goToProfile} onPricing={goToPricing} onPremium={goToPremium} onAdmin={goToAdmin} onSignOut={signOut} />) : <Auth view={authView} notice={authNotice} onClearNotice={() => setAuthNotice("")} onPasswordResetComplete={handlePasswordResetComplete} onViewChange={goToAuthView} />}</TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export type AppUser = User;
