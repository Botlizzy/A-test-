/* Coastal Signal app shell: auth is the doorway, playback is the protected room, and session transitions stay explicit. */
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

function getAuthMode() {
  return new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login";
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">(getAuthMode);
  const [showProfile, setShowProfile] = useState(() => new URLSearchParams(window.location.search).get("profile") === "1");

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingAuth(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCheckingAuth(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  const goToProfile = () => {
    window.history.pushState({}, "", "/?profile=1");
    setShowProfile(true);
  };

  const goToFeed = () => {
    window.history.pushState({}, "", "/");
    setShowProfile(false);
  };

  if (checkingAuth) {
    return <div className="auth-loading"><span className="signal-mark"><span /><span /><span /></span><p>Tuning into your session…</p></div>;
  }

  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster />{session?.user ? (showProfile ? <Profile user={session.user} onBack={goToFeed} onSignOut={signOut} /> : <Home user={session.user} onProfile={goToProfile} onSignOut={signOut} />) : <Auth mode={authMode} onModeChange={(mode) => { setAuthMode(mode); window.history.replaceState({}, "", `/?mode=${mode}`); }} />}</TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export type AppUser = User;
