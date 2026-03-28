"use client";

import React from "react";
import { Shield, LogIn, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user, loading, signIn, logOut } = useAuth();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between border-b border-border-custom bg-background/80 backdrop-blur-md px-6 py-4"
      role="banner"
    >
      {/* ─── Brand ─── */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#bc8cff] animate-gradient">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            MedBridge
          </h1>
          <p className="text-xs text-muted -mt-0.5">
            AI Drug Interaction Triage
          </p>
        </div>
      </div>

      {/* ─── Auth Controls ─── */}
      <div className="flex items-center gap-3">
        <span className="badge badge-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          System Online
        </span>

        {loading ? (
          <Loader2 size={18} className="text-muted animate-spin" />
        ) : user ? (
          <div className="flex items-center gap-3">
            {user.photoURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName ?? "User avatar"}
                className="h-8 w-8 rounded-full border border-border-custom"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="hidden sm:block text-sm text-foreground truncate max-w-[140px]">
              {user.displayName ?? user.email}
            </span>
            <button
              id="sign-out-btn"
              onClick={() => logOut()}
              aria-label="Sign out of your account"
              className="flex items-center gap-1.5 rounded-lg border border-border-custom px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            id="sign-in-btn"
            onClick={() => signIn()}
            aria-label="Sign in with Google"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#bc8cff] px-4 py-2 text-xs font-semibold text-white hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
          >
            <LogIn size={14} />
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
