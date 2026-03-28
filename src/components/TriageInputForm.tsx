"use client";

import React, { type ChangeEvent, type DragEvent } from "react";
import {
  Upload,
  Mic,
  MicOff,
  ImageIcon,
  X,
  AlertTriangle,
  Activity,
  CheckCircle,
  Send,
} from "lucide-react";

/* ──────────────────── Waveform Constants ──────────────────── */

const WAVEFORM_BAR_COUNT = 40;
const STATIC_WAVEFORM_HEIGHTS: string[] = [
  "10%", "16%", "21%", "24%", "25%", "23%", "19%", "14%", "10%", "10%",
  "10%", "13%", "18%", "22%", "25%", "25%", "22%", "17%", "12%", "10%",
  "10%", "11%", "16%", "20%", "24%", "25%", "24%", "20%", "16%", "11%",
  "10%", "10%", "12%", "17%", "22%", "25%", "25%", "22%", "18%", "13%",
];

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

/* ──────────────────── Props ──────────────────── */

export interface TriageInputFormProps {
  /** Object URL preview of the uploaded image */
  imagePreview: string | null;
  /** The uploaded File object (used for filename display) */
  imageFile: File | null;
  /** Whether the audio blob has been captured */
  hasAudio: boolean;
  /** Whether the microphone is currently recording */
  isRecording: boolean;
  /** Elapsed recording time in seconds */
  recordingTime: number;
  /** Whether the API call is in progress */
  isLoading: boolean;
  /** Whether the submit button should be enabled */
  canSubmit: boolean;
  /** Active drag-over state for drop zone */
  dragActive: boolean;
  /** Error message (shown at bottom of input area) */
  error: string | null;

  /* ── Handlers ── */
  onDrag: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onToggleRecording: () => void;
  onAnalyze: () => void;

  /** Ref forwarded to the hidden file input */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

/* ──────────────────── Component ──────────────────── */

export default function TriageInputForm({
  imagePreview,
  imageFile,
  hasAudio,
  isRecording,
  recordingTime,
  isLoading,
  canSubmit,
  dragActive,
  error,
  onDrag,
  onDrop,
  onFileChange,
  onClearImage,
  onToggleRecording,
  onAnalyze,
  fileInputRef,
}: TriageInputFormProps) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="lg:col-span-5 flex flex-col gap-5">
      {/* ── Upload Card ── */}
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
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
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
              onChange={onFileChange}
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
                onClick={onClearImage}
                aria-label="Remove uploaded file"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Audio Card ── */}
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
            onClick={onToggleRecording}
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
            ) : hasAudio ? (
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

          {/* Waveform */}
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
        onClick={onAnalyze}
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
  );
}
