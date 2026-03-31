"use client";

import React, { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { User } from "firebase/auth";
import type { TriageResult } from "@/lib/schema";
import TriageInputForm from "@/components/TriageInputForm";
import TriageHistory from "@/components/TriageHistory";
import { useFileHandler } from "@/hooks/useFileHandler";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { FilePlus, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TriageResultCard = dynamic(
  () => import("@/components/TriageResultCard"),
  {
    ssr: false,
    loading: () => (
      <section className="lg:col-span-7 glass-card p-6 animate-pulse">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
          <div className="h-16 w-16 rounded-2xl bg-surface-elevated" />
          <div className="h-4 w-48 rounded bg-surface-elevated" />
          <div className="h-3 w-64 rounded bg-surface-elevated" />
        </div>
      </section>
    ),
  }
);

interface TriageDashboardProps {
  user: User;
}

export default function TriageDashboard({ user }: TriageDashboardProps) {
  const {
    imageFile, imagePreview, dragActive, fileError,
    onDrag, onDrop, onFileChange, clearImage,
  } = useFileHandler();

  const {
    audioBlob, isRecording, recordingTime, audioError,
    toggleRecording, clearAudio,
  } = useAudioRecorder();

  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [symptomsText, setSymptomsText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const displayError = fileError || audioError || apiError;

  const analyzeData = useCallback(async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setApiError(null);
    setTriageResult(null);
    setSaveStatus("saving");

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      if (audioBlob) {
        formData.append("audio", audioBlob, `recording.${audioBlob.type.split('/')[1] || 'webm'}`);
      }
      if (symptomsText.trim()) {
        formData.append("symptoms_text", symptomsText.trim());
      }

      const idToken = await user.getIdToken();

      const res = await fetch("/api/analyze-triage", {
        method: "POST",
        headers: { "Authorization": `Bearer ${idToken}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Server error (${res.status}).`);
      }

      const data: TriageResult = await res.json();
      setTriageResult(data);
      setSaveStatus("saved");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setApiError(msg);
      setSaveStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, audioBlob, symptomsText, user]);

  const resetAll = useCallback(() => {
    clearImage();
    clearAudio();
    setSymptomsText("");
    setIsLoading(false);
    setApiError(null);
    setTriageResult(null);
    setSaveStatus("idle");
  }, [clearImage, clearAudio]);

  const canSubmit = !!imageFile && !isLoading && !isRecording;

  // Animation variants for the tab content
  const tabVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8" role="main">
      <div className="mx-auto max-w-7xl">
        
        {/* ─── ANIMATED TAB NAVIGATION ─── */}
        <div className="flex gap-4 mb-8 border-b border-border-custom relative">
          <button
            onClick={() => setActiveTab("new")}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "new" ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <FilePlus size={18} /> New Triage
            {activeTab === "new" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "history" ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <History size={18} /> Patient History
            {activeTab === "history" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* ─── TAB CONTENT WITH CROSSFADE ─── */}
        <AnimatePresence mode="wait">
          {activeTab === "new" ? (
            <motion.div
              key="new-tab"
              variants={tabVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-12 gap-5"
            >
              <TriageInputForm
                symptomsText={symptomsText}
                onSymptomsTextChange={setSymptomsText}
                imagePreview={imagePreview}
                imageFile={imageFile}
                hasAudio={!!audioBlob}
                isRecording={isRecording}
                recordingTime={recordingTime}
                isLoading={isLoading}
                canSubmit={canSubmit}
                dragActive={dragActive}
                error={displayError}
                onDrag={onDrag}
                onDrop={onDrop}
                onFileChange={onFileChange}
                onClearImage={clearImage}
                onToggleRecording={toggleRecording}
                onAnalyze={analyzeData}
                fileInputRef={fileInputRef}
              />

              <TriageResultCard
                result={triageResult}
                saveStatus={saveStatus}
                hasImage={!!imageFile}
                hasAudio={!!audioBlob || !!symptomsText.trim()}
                onReset={resetAll}
              />
            </motion.div>
          ) : (
            <motion.div
              key="history-tab"
              variants={tabVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
            >
              <TriageHistory user={user} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}