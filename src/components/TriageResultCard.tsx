"use client";

import React from "react";
import type { TriageResult } from "@/lib/schema";
import {
  Activity,
  Pill,
  AlertTriangle,
  CheckCircle,
  FileCode2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Shield
} from "lucide-react";

interface TriageResultCardProps {
  result: TriageResult | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  hasImage: boolean;
  hasAudio: boolean;
  onReset: () => void;
}

export default function TriageResultCard({
  result,
  saveStatus,
  hasImage,
  hasAudio,
  onReset,
}: TriageResultCardProps) {
  if (!result) {
    return (
      <section className="lg:col-span-7 flex flex-col items-center justify-center p-12 text-center glass-card border border-border-custom bg-surface-elevated/30">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-muted shadow-inner">
          <FileCode2 size={28} />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Analysis Results</h3>
        <p className="mt-2 text-sm text-muted max-w-sm">
          Upload a prescription image and record patient symptoms, then press <strong>Process Triage</strong> to generate an AI-powered analysis.
        </p>
        <div className="mt-6 flex gap-3">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${hasImage ? "bg-success-muted text-success" : "bg-surface-elevated text-muted"}`}>
            <CheckCircle size={14} /> Image ready
          </span>
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${hasAudio ? "bg-success-muted text-success" : "bg-surface-elevated text-muted"}`}>
            <CheckCircle size={14} /> Symptoms ready
          </span>
        </div>
      </section>
    );
  }

  // Determine Risk Badge Color
  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case "low": return <span className="flex items-center gap-1.5 rounded-full bg-success-muted px-3 py-1 text-xs font-bold text-success border border-success/20"><ShieldCheck size={14} /> LOW RISK</span>;
      case "medium": return <span className="flex items-center gap-1.5 rounded-full bg-warning-muted px-3 py-1 text-xs font-bold text-warning border border-warning/20"><Shield size={14} /> MEDIUM RISK</span>;
      case "high": return <span className="flex items-center gap-1.5 rounded-full bg-[#ff7b72]/10 px-3 py-1 text-xs font-bold text-[#ff7b72] border border-[#ff7b72]/20"><ShieldAlert size={14} /> HIGH RISK</span>;
      case "critical": return <span className="flex items-center gap-1.5 rounded-full bg-danger-muted px-3 py-1 text-xs font-bold text-danger border border-danger/20 animate-pulse"><AlertTriangle size={14} /> CRITICAL RISK</span>;
      default: return <span className="flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1 text-xs font-bold text-foreground"><Shield size={14} /> UNKNOWN RISK</span>;
    }
  };

  return (
    <section className="lg:col-span-7 flex flex-col gap-5 animate-fade-in-up">
      {/* Header Info */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted text-accent">
            <FileCode2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Analysis Results</h2>
            <p className="text-xs text-muted">AI-generated structured report</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getRiskBadge(result.risk_level)}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle size={12} /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Symptoms */}
      <div className="glass-card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Activity size={18} className="text-accent" /> Patient Symptoms</h3>
        <ul className="space-y-2">
          {result.symptoms.map((sym, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted">
              <span className="mt-1 text-accent">›</span> {sym}
            </li>
          ))}
        </ul>
      </div>

      {/* Medications */}
      <div className="glass-card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Pill size={18} className="text-accent" /> Identified Medications</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.identified_medications.map((med, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-border-custom bg-surface p-3 text-sm text-foreground shadow-sm">
              <Pill size={16} className="text-muted shrink-0" /> 
              <span className="truncate">{med}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Interactions */}
      <div className="glass-card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><AlertTriangle size={18} className="text-warning" /> Potential Interactions</h3>
        <div className="rounded-xl border border-warning/20 bg-warning-muted/30 p-4">
          <p className="text-sm leading-relaxed text-foreground/90">{result.potential_interactions}</p>
        </div>
      </div>

      {/* Action Plan */}
      <div className="glass-card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><CheckCircle size={18} className="text-success" /> Action Plan</h3>
        <div className="space-y-3">
          {result.action_plan.map((step, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border-custom bg-surface p-4 shadow-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
                {i + 1}
              </div>
              <p className="text-sm text-foreground/90 mt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="glass-card mt-2 flex w-full items-center justify-center gap-2 p-4 text-sm font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
      >
        <RefreshCcw size={16} /> Start New Triage
      </button>
    </section>
  );
}