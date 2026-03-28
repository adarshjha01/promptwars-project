"use client";

import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import TriageDashboard from "@/components/TriageDashboard";
import { Shield, LogIn, Loader2 } from "lucide-react";

export default function HomePage() {
  const { user, loading, signIn } = useAuth();

  return (
    <div className="flex flex-1 flex-col bg-background">
      <Header />

      {loading ? (
        /* ── Loading State ── */
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 size={32} className="text-accent animate-spin" />
            <p className="text-sm text-muted">Authenticating…</p>
          </div>
        </div>
      ) : user ? (
        /* ── Authenticated: show dashboard ── */
        <TriageDashboard user={user} />
      ) : (
        /* ── Not authenticated: prompt login ── */
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="glass-card p-10 max-w-md text-center animate-fade-in-up">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-[#58a6ff] to-[#bc8cff] mb-6">
              <Shield size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Welcome to MedBridge
            </h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Sign in with your Google account to access AI-powered drug
              interaction triage. Your results will be securely stored and
              accessible anytime.
            </p>
            <button
              id="login-cta-btn"
              onClick={() => signIn()}
              aria-label="Sign in with Google to access the dashboard"
              className="flex items-center justify-center gap-2 mx-auto rounded-xl bg-gradient-to-r from-[#58a6ff] to-[#bc8cff] px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
            >
              <LogIn size={16} />
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer
        className="border-t border-border-custom px-6 py-4 text-center text-xs text-muted"
        role="contentinfo"
      >
        <p>
          MedBridge &middot; AI-powered drug interaction triage &middot; Not for
          clinical use
        </p>
      </footer>
    </div>
  );
}
