"use client";

import React, { type ChangeEvent, type DragEvent, useState } from "react";
import {
  Upload, Mic, MicOff, ImageIcon, X, AlertTriangle, 
  Activity, CheckCircle, Send, Keyboard
} from "lucide-react";

type LucideIcon = React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;

function SectionHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string; }) {
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

export interface TriageInputFormProps {
  imagePreview: string | null;
  imageFile: File | null;
  hasAudio: boolean;
  isRecording: boolean;
  recordingTime: number;
  isLoading: boolean;
  canSubmit: boolean;
  dragActive: boolean;
  error: string | null;
  symptomsText: string;
  onSymptomsTextChange: (text: string) => void;
  onDrag: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onToggleRecording: () => void;
  onAnalyze: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function TriageInputForm({
  imagePreview, imageFile, hasAudio, isRecording, recordingTime,
  isLoading, canSubmit, dragActive, error,
  symptomsText, onSymptomsTextChange,
  onDrag, onDrop, onFileChange, onClearImage, onToggleRecording, onAnalyze, fileInputRef,
}: TriageInputFormProps) {
  
  const [inputMode, setInputMode] = useState<"audio" | "text">("audio");

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="lg:col-span-5 flex flex-col gap-5">
      {/* ── Upload Card ── */}
      <section className="glass-card p-6 animate-fade-in-up">
        <SectionHeader icon={ImageIcon} title="Prescription Upload" subtitle="Drag & drop or click to upload a photo" />
        {!imagePreview ? (
          <div
            className={`drop-zone flex flex-col items-center justify-center gap-4 p-10 cursor-pointer ${dragActive ? "border-accent bg-accent/5" : "border-border-custom"}`}
            onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-muted text-accent">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{dragActive ? "Release to upload" : "Drop image here or click to browse"}</p>
              <p className="mt-1 text-xs text-muted">PNG, JPG, or HEIC up to 10 MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-border-custom">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Uploaded prescription" className="w-full max-h-64 object-cover" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
              <span className="text-sm text-white truncate max-w-[70%]">{imageFile?.name}</span>
              <button onClick={onClearImage} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Symptom Input Card ── */}
      <section className="glass-card p-6 animate-fade-in-up-delay-1">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader icon={Activity} title="Symptoms" subtitle="How is the patient feeling?" />
          <div className="flex bg-surface-elevated rounded-lg p-1 border border-border-custom">
            <button
              onClick={() => setInputMode("audio")}
              className={`p-2 rounded-md transition-colors ${inputMode === "audio" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-foreground"}`}
              title="Use Microphone"
            >
              <Mic size={16} />
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`p-2 rounded-md transition-colors ${inputMode === "text" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-foreground"}`}
              title="Type Symptoms"
            >
              <Keyboard size={16} />
            </button>
          </div>
        </div>

        <div className="py-2">
          {inputMode === "audio" ? (
            <div className="flex flex-col items-center gap-5">
              <button
                onClick={onToggleRecording}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                  isRecording ? "bg-danger text-white animate-pulse" : "bg-surface-elevated text-muted hover:bg-accent-muted hover:text-accent"
                }`}
              >
                {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
              <div className="text-center">
                {isRecording ? (
                  <>
                    <p className="text-2xl font-mono font-semibold text-danger">{formatTime(recordingTime)}</p>
                    <p className="text-xs text-muted mt-1">Recording…</p>
                  </>
                ) : hasAudio ? (
                  <p className="text-sm text-success flex items-center justify-center gap-1.5"><CheckCircle size={14} /> Audio recorded ({formatTime(recordingTime)})</p>
                ) : (
                  <p className="text-sm text-muted">Tap to record symptoms</p>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full">
              <textarea
                value={symptomsText}
                onChange={(e) => onSymptomsTextChange(e.target.value)}
                placeholder="E.g., Mild fever, headache since yesterday..."
                className="w-full h-32 bg-surface-elevated border border-border-custom rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Submit Area ── */}
      <button
        onClick={onAnalyze}
        disabled={!canSubmit}
        className={`glass-card flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-300 animate-fade-in-up-delay-2 ${
          canSubmit ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer" : "bg-surface-elevated text-muted cursor-not-allowed opacity-60"
        }`}
      >
        {isLoading ? "Analyzing..." : <><Send size={16} /> Process Triage</>}
      </button>

      {error && (
        <div className="glass-card border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}