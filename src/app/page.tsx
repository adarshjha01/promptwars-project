"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  Mic,
  MicOff,
  ImageIcon,
  X,
  Shield,
  AlertTriangle,
  Activity,
  ClipboardList,
  FileJson,
  Sparkles,
  ChevronRight,
} from "lucide-react";

/* ─── Placeholder Result Data ─── */
const PLACEHOLDER_RESULT = {
  patientSymptoms: [
    "Persistent headache (frontal region)",
    "Dizziness upon standing",
    "Nausea — intermittent, post-meal",
    "Elevated blood pressure (148/92 mmHg)",
  ],
  identifiedDrugs: [
    { name: "Lisinopril", dosage: "20 mg", frequency: "Once daily" },
    { name: "Ibuprofen", dosage: "400 mg", frequency: "As needed" },
    { name: "Metformin", dosage: "500 mg", frequency: "Twice daily" },
  ],
  interactionRisk: {
    level: "HIGH",
    summary:
      "Ibuprofen may reduce the antihypertensive effect of Lisinopril and increase the risk of renal impairment when combined. Concurrent use requires close monitoring of blood pressure and kidney function.",
    pairs: [
      {
        drugs: "Lisinopril ↔ Ibuprofen",
        severity: "High",
        mechanism:
          "NSAIDs inhibit prostaglandin synthesis, reducing renal blood flow and counteracting ACE-inhibitor efficacy.",
      },
    ],
  },
  actionPlan: [
    "Discontinue or reduce Ibuprofen; consider Acetaminophen as alternative analgesic.",
    "Monitor blood pressure twice daily for 7 days.",
    "Order renal function panel (BUN, Creatinine) within 48 hours.",
    "Schedule follow-up with prescribing physician in 5 business days.",
  ],
};

/* ─── Section Header Component ─── */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
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

/* ─── Risk Badge ─── */
function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { cls: string; label: string }> = {
    HIGH: { cls: "badge-danger", label: "High Risk" },
    MEDIUM: { cls: "badge-warning", label: "Medium Risk" },
    LOW: { cls: "badge-success", label: "Low Risk" },
  };
  const c = config[level] ?? config.LOW;
  return (
    <span className={`badge ${c.cls}`} role="status" aria-label={`Risk level: ${c.label}`}>
      <AlertTriangle size={12} />
      {c.label}
    </span>
  );
}

/* ─── Main Page ─── */
export default function DashboardPage() {
  /* Upload state */
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    preview: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Audio state */
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Results */
  const result = PLACEHOLDER_RESULT;

  /* ── Drag handlers ── */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFile({ name: file.name, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  /* ── Recording toggle ── */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  /* ─── Render ─── */
  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* ─── Top Bar ─── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between border-b border-border-custom bg-background/80 backdrop-blur-md px-6 py-4"
        role="banner"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#bc8cff] animate-gradient">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              MedScan AI
            </h1>
            <p className="text-xs text-muted -mt-0.5">Drug Interaction Analyzer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            System Online
          </span>
        </div>
      </header>

      {/* ─── Main Grid ─── */}
      <main
        className="flex-1 p-4 sm:p-6 lg:p-8"
        role="main"
        aria-label="Dashboard content"
      >
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ── Left Column: Upload + Audio ── */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Upload Card */}
            <section
              className="glass-card p-6 animate-fade-in-up"
              aria-labelledby="upload-heading"
            >
              <SectionHeader
                icon={ImageIcon}
                title="Prescription Upload"
                subtitle="Drag & drop or click to upload a photo"
              />

              {!uploadedFile ? (
                <div
                  id="upload-drop-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload prescription photo. Drag and drop an image or click to browse."
                  className={`drop-zone flex flex-col items-center justify-center gap-4 p-10 cursor-pointer ${
                    dragActive ? "active" : ""
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted text-accent">
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {dragActive
                        ? "Release to upload"
                        : "Drop image here or click to browse"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      PNG, JPG, or HEIC up to 10 MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-hidden="true"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border-custom">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedFile.preview}
                    alt={`Uploaded prescription: ${uploadedFile.name}`}
                    className="w-full max-h-64 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <span className="text-sm text-white truncate max-w-[70%]">
                      {uploadedFile.name}
                    </span>
                    <button
                      onClick={() => setUploadedFile(null)}
                      aria-label="Remove uploaded file"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Audio Card */}
            <section
              className="glass-card p-6 animate-fade-in-up-delay-1"
              aria-labelledby="audio-heading"
            >
              <SectionHeader
                icon={Activity}
                title="Symptom Recording"
                subtitle="Record patient-reported symptoms via microphone"
              />

              <div className="flex flex-col items-center gap-5 py-4">
                {/* Mic Button */}
                <button
                  id="mic-toggle"
                  aria-label={
                    isRecording
                      ? "Stop recording audio"
                      : "Start recording audio"
                  }
                  aria-pressed={isRecording}
                  onClick={toggleRecording}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300
                    ${
                      isRecording
                        ? "bg-danger text-white animate-pulse-ring"
                        : "bg-surface-elevated text-muted hover:bg-accent-muted hover:text-accent"
                    }
                  `}
                >
                  {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                </button>

                {/* Timer / Status */}
                <div className="text-center">
                  {isRecording ? (
                    <>
                      <p
                        className="text-2xl font-mono font-semibold text-danger"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {formatTime(recordingTime)}
                      </p>
                      <p className="text-xs text-muted mt-1">Recording…</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">
                      Tap the microphone to begin
                    </p>
                  )}
                </div>

                {/* Waveform placeholder */}
                <div
                  className="w-full h-12 rounded-lg overflow-hidden"
                  aria-hidden="true"
                >
                  <div className="flex items-end justify-center gap-[3px] h-full px-4">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const height = isRecording
                        ? `${20 + Math.random() * 80}%`
                        : `${10 + Math.sin(i * 0.4) * 15}%`;
                      return (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isRecording ? "bg-danger/60" : "bg-muted/30"
                          }`}
                          style={{ height }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── Right Column: Results ── */}
          <section
            className="lg:col-span-7 glass-card p-6 animate-fade-in-up-delay-2"
            aria-labelledby="results-heading"
          >
            <div className="flex items-center justify-between mb-6">
              <SectionHeader
                icon={FileJson}
                title="Analysis Results"
                subtitle="AI-generated structured report"
              />
              <RiskBadge level={result.interactionRisk.level} />
            </div>

            {/* Result Sections */}
            <div className="space-y-6">
              {/* Patient Symptoms */}
              <ResultBlock
                icon={ClipboardList}
                title="Patient Symptoms"
                ariaLabel="Patient symptoms list"
              >
                <ul className="space-y-2" role="list">
                  {result.patientSymptoms.map((s, i) => (
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

              {/* Identified Drugs */}
              <ResultBlock
                icon={Sparkles}
                title="Identified Drugs"
                ariaLabel="Identified drugs table"
              >
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    aria-label="Identified drugs table"
                  >
                    <thead>
                      <tr className="text-left text-muted border-b border-border-custom">
                        <th className="pb-2 pr-4 font-medium">Drug</th>
                        <th className="pb-2 pr-4 font-medium">Dosage</th>
                        <th className="pb-2 font-medium">Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.identifiedDrugs.map((d, i) => (
                        <tr
                          key={i}
                          className="border-b border-border-custom last:border-0"
                        >
                          <td className="py-2.5 pr-4 font-medium text-foreground">
                            {d.name}
                          </td>
                          <td className="py-2.5 pr-4 text-foreground/80">
                            {d.dosage}
                          </td>
                          <td className="py-2.5 text-foreground/80">
                            {d.frequency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ResultBlock>

              {/* Interaction Risk */}
              <ResultBlock
                icon={AlertTriangle}
                title="Interaction Risk"
                ariaLabel="Interaction risk details"
              >
                <p className="text-sm text-foreground/80 mb-3">
                  {result.interactionRisk.summary}
                </p>
                {result.interactionRisk.pairs.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-danger-muted border border-danger/20 p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-danger">
                        {p.drugs}
                      </span>
                      <span className="badge badge-danger text-[10px]">
                        {p.severity}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/70">{p.mechanism}</p>
                  </div>
                ))}
              </ResultBlock>

              {/* Action Plan */}
              <ResultBlock
                icon={Shield}
                title="Action Plan"
                ariaLabel="Recommended action plan"
              >
                <ol className="space-y-2 list-none" role="list">
                  {result.actionPlan.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </ResultBlock>

              {/* Raw JSON Toggle */}
              <RawJsonPanel data={result} />
            </div>
          </section>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer
        className="border-t border-border-custom px-6 py-4 text-center text-xs text-muted"
        role="contentinfo"
      >
        <p>
          MedScan AI &middot; Placeholder data for demonstration &middot; Not
          for clinical use
        </p>
      </footer>
    </div>
  );
}

/* ─── Result Block ─── */
function ResultBlock({
  icon: Icon,
  title,
  ariaLabel,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
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

/* ─── Raw JSON Panel ─── */
function RawJsonPanel({ data }: { data: typeof PLACEHOLDER_RESULT }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-surface/60 border border-border-custom overflow-hidden">
      <button
        id="json-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="json-content"
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
