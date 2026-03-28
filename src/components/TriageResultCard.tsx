"use client";

import React, { useState } from "react";
import {
  ImageIcon,
  Mic,
  AlertTriangle,
  Activity,
  Pill,
  CheckCircle,
  FileJson,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import type { TriageResult } from "@/lib/schema";

/* ──────────────────── Sub-components ──────────────────── */

type LucideIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number | string }
>;

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function ResultBlock({
  icon: Icon,
  title,
  ariaLabel,
  children,
}: {
  icon: LucideIcon;
  title: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl bg-surface/60 border border-border-custom p-4"
      role="region"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-accent" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function RiskBadge({ level }: { level: TriageResult["risk_level"] }) {
  const config: Record<string, { cls: string; label: string }> = {
    Critical: { cls: "badge-critical", label: "Critical" },
    High: { cls: "badge-danger", label: "High Risk" },
    Medium: { cls: "badge-warning", label: "Medium Risk" },
    Low: { cls: "badge-success", label: "Low Risk" },
  };
  const c = config[level] ?? config.Low;
  return (
    <span
      className={`badge ${c.cls}`}
      role="status"
      aria-label={`Risk level: ${c.label}`}
    >
      <AlertTriangle size={12} />
      {c.label}
    </span>
  );
}

function RawJsonPanel({ data }: { data: TriageResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-surface/60 border border-border-custom overflow-hidden">
      <button
        id="json-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="json-content"
        aria-label="Toggle raw JSON output"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileJson size={16} className="text-accent" />
          <span>Raw JSON Output</span>
        </div>
        <ChevronRight
          size={16}
          className={`text-muted transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div id="json-content" role="region" aria-label="Raw JSON output">
          <pre className="overflow-x-auto p-4 border-t border-border-custom text-xs font-mono leading-relaxed text-foreground/80">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Props ──────────────────── */

export interface TriageResultCardProps {
  /** Validated triage result data (null = empty / waiting state) */
  result: TriageResult | null;
  /** Current Firestore save status */
  saveStatus: "idle" | "saving" | "saved" | "error";
  /** Whether the image file has been uploaded (for readiness indicator) */
  hasImage: boolean;
  /** Whether the audio blob has been captured (for readiness indicator) */
  hasAudio: boolean;
  /** Reset handler to start a new triage session */
  onReset: () => void;
}

/* ──────────────────── Component ──────────────────── */

export default function TriageResultCard({
  result,
  saveStatus,
  hasImage,
  hasAudio,
  onReset,
}: TriageResultCardProps) {
  return (
    <section
      className="lg:col-span-7 glass-card p-6 animate-fade-in-up-delay-2"
      aria-labelledby="results-heading"
    >
      {result ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <SectionHeader
              icon={FileJson}
              title="Analysis Results"
              subtitle="AI-generated structured report"
            />
            <div className="flex items-center gap-2">
              <RiskBadge level={result.risk_level} />
              {saveStatus === "saved" && (
                <span className="badge badge-success text-[10px]">
                  <CheckCircle size={10} />
                  Saved
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="badge badge-warning text-[10px]">
                  Saving…
                </span>
              )}
            </div>
          </div>

          {/* Result Sections */}
          <div className="space-y-6">
            {/* Symptoms */}
            <ResultBlock
              icon={Activity}
              title="Patient Symptoms"
              ariaLabel="Patient symptoms list"
            >
              <ul className="space-y-2" role="list">
                {result.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight
                      size={14}
                      className="mt-0.5 shrink-0 text-accent"
                    />
                    <span className="text-foreground/90">{s}</span>
                  </li>
                ))}
              </ul>
            </ResultBlock>

            {/* Identified Medications */}
            <ResultBlock
              icon={Pill}
              title="Identified Medications"
              ariaLabel="Identified medications list"
            >
              <ul className="space-y-2" role="list">
                {result.identified_medications.map((med, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Pill
                      size={14}
                      className="mt-0.5 shrink-0 text-accent"
                    />
                    <span className="text-foreground/90">{med}</span>
                  </li>
                ))}
              </ul>
            </ResultBlock>

            {/* Interaction Risk / Warning Callout */}
            <ResultBlock
              icon={AlertTriangle}
              title="Potential Interactions"
              ariaLabel="Potential drug interactions"
            >
              <div className="rounded-xl bg-warning-muted/40 border border-warning/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    size={16}
                    className="text-warning shrink-0"
                  />
                  <span className="text-sm font-semibold text-warning">
                    Interaction Warning
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {result.potential_interactions}
                </p>
              </div>
            </ResultBlock>

            {/* Action Plan */}
            <ResultBlock
              icon={CheckCircle}
              title="Action Plan"
              ariaLabel="Recommended action plan"
            >
              <ol className="space-y-2 list-none" role="list">
                {result.action_plan.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90 pt-0.5">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </ResultBlock>

            {/* Raw JSON */}
            <RawJsonPanel data={result} />
          </div>

          {/* Reset Button */}
          <button
            id="new-triage-btn"
            onClick={onReset}
            aria-label="Start a new triage session"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border-custom px-5 py-3 text-sm font-medium text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            <RotateCcw size={16} />
            Start New Triage
          </button>
        </>
      ) : (
        /* ── Empty / Waiting State ── */
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-muted">
            <FileJson size={28} />
          </div>
          <div>
            <h2
              id="results-heading"
              className="text-lg font-semibold text-foreground mb-1"
            >
              Analysis Results
            </h2>
            <p className="text-sm text-muted max-w-sm">
              Upload a prescription image and record patient symptoms,
              then press <strong>Process Triage</strong> to generate an
              AI-powered analysis.
            </p>
          </div>

          {/* Readiness Indicators */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
                hasImage
                  ? "bg-success-muted text-success"
                  : "bg-surface-elevated text-muted"
              }`}
            >
              {hasImage ? (
                <CheckCircle size={12} />
              ) : (
                <ImageIcon size={12} />
              )}
              {hasImage ? "Image ready" : "Awaiting image"}
            </div>
            <div
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
                hasAudio
                  ? "bg-success-muted text-success"
                  : "bg-surface-elevated text-muted"
              }`}
            >
              {hasAudio ? (
                <CheckCircle size={12} />
              ) : (
                <Mic size={12} />
              )}
              {hasAudio ? "Audio ready" : "Awaiting recording"}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
