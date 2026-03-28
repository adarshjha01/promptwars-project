"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  Upload,
  Mic,
  MicOff,
  ImageIcon,
  X,
  Shield,
  AlertTriangle,
  Activity,
  Pill,
  CheckCircle,
  FileJson,
  ChevronRight,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react";

/* ───────────────────────── Types ───────────────────────── */

/** Matches the exact schema enforced by the API route's responseSchema */
interface TriageResult {
  symptoms: string[];
  identified_medications: string[];
  risk_level: "Low" | "Medium" | "High" | "Critical";
  potential_interactions: string;
  action_plan: string[];
}

type LucideIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number | string }
>;

/** Pre-computed static heights for the idle waveform — hardcoded to avoid any
 *  floating-point precision differences between SSR (Node) and client (V8). */
const WAVEFORM_BAR_COUNT = 40;
const STATIC_WAVEFORM_HEIGHTS: string[] = [
  "10%", "16%", "21%", "24%", "25%", "23%", "19%", "14%", "10%", "10%",
  "10%", "13%", "18%", "22%", "25%", "25%", "22%", "17%", "12%", "10%",
  "10%", "11%", "16%", "20%", "24%", "25%", "24%", "20%", "16%", "11%",
  "10%", "10%", "12%", "17%", "22%", "25%", "25%", "22%", "18%", "13%",
];

/* ──────────────────── Sub-components ──────────────────── */

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

/* ──────────────────── Main Dashboard ──────────────────── */

export default function DashboardPage() {
  /* ── State ── */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  /* ── Refs ── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───── Image Handling ───── */

  const setImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      // Revoke previous preview URL to prevent memory leak
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      const url = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreview(url);
      setError(null);
    },
    [imagePreview],
  );

  const clearImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) setImage(file);
    },
    [setImage],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setImage(file);
    },
    [setImage],
  );

  /* ───── Audio Recording ───── */

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        // Stop all tracks so mic indicator goes away
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      setError(
        "Microphone access denied. Please allow microphone permissions and try again.",
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  /* ───── API Integration ───── */

  const analyzeData = useCallback(async () => {
    if (!imageFile) {
      setError("Please upload a prescription image before processing.");
      return;
    }
    if (!audioBlob) {
      setError("Please record patient symptoms before processing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTriageResult(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/analyze-triage", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Server error (${res.status}). Please try again.`,
        );
      }

      const data: TriageResult = await res.json();
      setTriageResult(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, audioBlob]);

  /* ───── Reset ───── */

  const resetAll = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setAudioBlob(null);
    setIsRecording(false);
    setRecordingTime(0);
    setIsLoading(false);
    setError(null);
    setTriageResult(null);
  }, [imagePreview]);

  /* ───── Helpers ───── */

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const canSubmit = !!imageFile && !!audioBlob && !isLoading && !isRecording;

  /* ───────────────────── Render ───────────────────── */

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* ─── Header ─── */}
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
              MedBridge
            </h1>
            <p className="text-xs text-muted -mt-0.5">
              AI Drug Interaction Triage
            </p>
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
          {/* ── Left Column: Inputs ── */}
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

              {!imagePreview ? (
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
                    src={imagePreview}
                    alt={`Uploaded prescription: ${imageFile?.name ?? "image"}`}
                    className="w-full max-h-64 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <span className="text-sm text-white truncate max-w-[70%]">
                      {imageFile?.name}
                    </span>
                    <button
                      onClick={clearImage}
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
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                    isRecording
                      ? "bg-danger text-white animate-pulse-ring"
                      : "bg-surface-elevated text-muted hover:bg-accent-muted hover:text-accent"
                  }`}
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
                  ) : audioBlob ? (
                    <p className="text-sm text-success flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      Audio recorded ({formatTime(recordingTime)})
                    </p>
                  ) : (
                    <p className="text-sm text-muted">
                      Tap the microphone to begin
                    </p>
                  )}
                </div>

                {/* Waveform — CSS-only animation, zero Math.random() */}
                <div
                  className="w-full h-12 rounded-lg overflow-hidden"
                  aria-hidden="true"
                >
                  <div className="flex items-end justify-center gap-[3px] h-full px-4">
                    {Array.from({ length: WAVEFORM_BAR_COUNT }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full ${
                          isRecording
                            ? `bg-danger/60 ${i % 2 === 0 ? "waveform-bar-recording" : "waveform-bar-recording-alt"}`
                            : "bg-muted/30"
                        }`}
                        style={
                          isRecording
                            ? { animationDelay: `${(i * 47) % 800}ms` }
                            : { height: STATIC_WAVEFORM_HEIGHTS[i] }
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Process Button ── */}
            <button
              id="process-triage-btn"
              onClick={analyzeData}
              disabled={!canSubmit}
              aria-label="Process triage analysis"
              className={`glass-card flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-300 animate-fade-in-up-delay-2 ${
                canSubmit
                  ? "bg-gradient-to-r from-[#58a6ff] to-[#bc8cff] text-white hover:shadow-lg hover:shadow-accent/20 cursor-pointer"
                  : "bg-surface-elevated text-muted cursor-not-allowed opacity-60"
              }`}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Send size={16} />
                  Process Triage
                </>
              )}
            </button>

            {/* ── Error Message ── */}
            {error && (
              <div
                role="alert"
                className="glass-card border-danger/30 bg-danger-muted/30 px-5 py-4 text-sm text-danger flex items-start gap-3"
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* ── Right Column: Results ── */}
          <section
            className="lg:col-span-7 glass-card p-6 animate-fade-in-up-delay-2"
            aria-labelledby="results-heading"
          >
            {triageResult ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader
                    icon={FileJson}
                    title="Analysis Results"
                    subtitle="AI-generated structured report"
                  />
                  <RiskBadge level={triageResult.risk_level} />
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
                      {triageResult.symptoms.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
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
                      {triageResult.identified_medications.map((med, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
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
                        {triageResult.potential_interactions}
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
                      {triageResult.action_plan.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm"
                        >
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
                  <RawJsonPanel data={triageResult} />
                </div>

                {/* Reset Button */}
                <button
                  id="new-triage-btn"
                  onClick={resetAll}
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
                      imageFile
                        ? "bg-success-muted text-success"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {imageFile ? (
                      <CheckCircle size={12} />
                    ) : (
                      <ImageIcon size={12} />
                    )}
                    {imageFile ? "Image ready" : "Awaiting image"}
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
                      audioBlob
                        ? "bg-success-muted text-success"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {audioBlob ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Mic size={12} />
                    )}
                    {audioBlob ? "Audio ready" : "Awaiting recording"}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

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
