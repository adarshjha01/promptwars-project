"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
import dynamic from "next/dynamic";
import type { User } from "firebase/auth";
import { saveTriageResult } from "@/lib/firestore.service";
import type { TriageResult } from "@/lib/schema";
import TriageInputForm from "@/components/TriageInputForm";

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
  },
);

/* ──────────────────── Main Dashboard ──────────────────── */

interface TriageDashboardProps {
  user: User;
}

export default function TriageDashboard({ user }: TriageDashboardProps) {
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  /* ── Refs ── */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    setSaveStatus("idle");

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

      /* Auto-save to Firestore */
      setSaveStatus("saving");
      try {
        await saveTriageResult(user.uid, data);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, audioBlob, user.uid]);

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
    setSaveStatus("idle");
  }, [imagePreview]);

  /* ───── Derived ───── */

  const canSubmit = !!imageFile && !!audioBlob && !isLoading && !isRecording;

  /* ───────────────────── Render ───────────────────── */

  return (
    <main
      className="flex-1 p-4 sm:p-6 lg:p-8"
      role="main"
      aria-label="Dashboard content"
    >
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-5">
        <TriageInputForm
          imagePreview={imagePreview}
          imageFile={imageFile}
          hasAudio={!!audioBlob}
          isRecording={isRecording}
          recordingTime={recordingTime}
          isLoading={isLoading}
          canSubmit={canSubmit}
          dragActive={dragActive}
          error={error}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onClearImage={clearImage}
          onToggleRecording={toggleRecording}
          onAnalyze={analyzeData}
          fileInputRef={fileInputRef}
        />

        <TriageResultCard
          result={triageResult}
          saveStatus={saveStatus}
          hasImage={!!imageFile}
          hasAudio={!!audioBlob}
          onReset={resetAll}
        />
      </div>
    </main>
  );
}
