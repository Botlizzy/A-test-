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
import ToolHub from "./pages/ToolHub";
import Auth from "./pages/Auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hasPermanentPremiumAccess } from "@/lib/premiumAccess";
import type { Session, User } from "@supabase/supabase-js";

function getAuthMode() {
  return new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">(getAuthMode);
  const [showProfile, setShowProfile] = useState(() => new URLSearchParams(window.location.search).get("profile") === "1");
  const [showPricing, setShowPricing] = useState(() => new URLSearchParams(window.location.search).get("pricing") === "1");
  const [showAdmin, setShowAdmin] = useState(() => new URLSearchParams(window.location.search).get("admin") === "1");
  const [showPremium, setShowPremium] = useState(() => new URLSearchParams(window.location.search).get("premium") === "1");
  const [showTools, setShowTools] = useState(() => new URLSearchParams(window.location.search).get("tools") === "1");
  const [premiumActive, setPremiumActive] = useState(false);
  const publicToolsRequested = new URLSearchParams(window.location.search).get("tools") === "1";

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
      setCheckingAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        const { data: entitlement } = await supabase.from("premium_entitlements").select("active").eq("user_id", nextSession.user.id).maybeSingle();
        setPremiumActive(Boolean(entitlement?.active) || hasPermanentPremiumAccess(nextSession.user.email));
      } else setPremiumActive(false);
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

  if (checkingAuth) {
    return <div className="auth-loading"><span className="signal-mark"><span /><span /><span /></span><p>Tuning into your session…</p></div>;
  }

  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster />{showPricing ? <Pricing user={session?.user} onBack={goToFeed} /> : (showTools || publicToolsRequested) ? <ToolHub user={session?.user} onBack={goToFeed} onSignOut={signOut} /> : session?.user ? (showAdmin ? <PremiumAdmin user={session.user} onBack={goToFeed} onSignOut={signOut} /> : showPremium ? <PremiumRoom user={session.user} isPremium={premiumActive} onBack={goToFeed} onPricing={goToPricing} onSignOut={signOut} /> : showProfile ? <Profile user={session.user} onBack={goToFeed} onSignOut={signOut} /> : <Home user={session.user} onProfile={goToProfile} onPricing={goToPricing} onPremium={goToPremium} onAdmin={goToAdmin} onTools={goToTools} onSignOut={signOut} />) : <Auth mode={authMode} onModeChange={(mode) => { setAuthMode(mode); window.history.replaceState({}, "", `/?mode=${mode}`); }} />}</TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export type AppUser = User;
