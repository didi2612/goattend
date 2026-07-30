"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  token: string;
  studentName: string;
  nextType: "Clock In" | "Clock Out";
};

type Step = "camera" | "confirm" | "done";

function StepDots({ step }: { step: Step }) {
  const index = step === "camera" ? 0 : step === "confirm" ? 1 : 2;
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: i === index ? 24 : 8,
            background: i <= index ? "var(--accent)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

export function PublicAttendanceForm({ token, studentName, nextType }: Props) {
  const [step, setStep] = useState<Step>("camera");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultType, setResultType] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isClockIn = nextType === "Clock In";

  useEffect(() => {
    if (step !== "camera" || photoDataUrl) return;

    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera access denied. Please allow camera access and reload the page."));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step, photoDataUrl]);

  function snap() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.85));

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function retake() {
    setPhotoDataUrl(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!photoDataUrl) return;
    setSubmitting(true);
    setError(null);
    setLocationStatus("idle");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/attend/${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageData: photoDataUrl,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            setError(data?.error ?? "Something went wrong. Please try again.");
            setSubmitting(false);
            return;
          }

          const data = (await res.json()) as { type: string };
          setResultType(data.type);
          setStep("done");
        } catch {
          setError("Network error. Please try again.");
        } finally {
          setSubmitting(false);
        }
      },
      () => {
        setLocationStatus("error");
        setSubmitting(false);
      },
    );
  }

  return (
    <div className="relative min-h-screen bg-background p-5">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center py-10">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground">
            A
          </div>
          <h1 className="text-center text-lg font-bold tracking-tight text-foreground">
            AZP Attendance
          </h1>
          <p className="text-center text-sm text-muted">{studentName}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {step !== "done" && <StepDots step={step} />}

          {step === "camera" && (
            <div>
              {photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoDataUrl}
                  alt="Selfie preview"
                  className="mb-4 aspect-[4/3] w-full rounded-xl object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="mb-4 aspect-[4/3] w-full rounded-xl bg-surface-hover object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {photoDataUrl ? (
                <div className="flex gap-3">
                  <button
                    onClick={retake}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 font-semibold text-foreground transition hover:bg-surface-hover"
                  >
                    <RotateCcw size={16} />
                    Retake
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-foreground transition hover:opacity-90"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={snap}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-foreground transition hover:opacity-90"
                >
                  <Camera size={18} />
                  Snap Photo
                </button>
              )}
            </div>
          )}

          {step === "confirm" && (
            <div>
              {photoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoDataUrl}
                  alt="Selfie preview"
                  className="mb-4 aspect-[4/3] w-full rounded-xl object-cover"
                />
              )}

              <div
                className="mb-4 flex items-center justify-center gap-2 rounded-xl p-4 text-center"
                style={{
                  background: isClockIn ? "var(--chart-blue-soft)" : "var(--chart-orange-soft)",
                  color: isClockIn ? "var(--chart-blue)" : "var(--chart-orange)",
                }}
              >
                {isClockIn ? <LogIn size={20} /> : <LogOut size={20} />}
                <p className="font-semibold">Confirm {nextType}</p>
              </div>

              {locationStatus === "error" && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  Location fetch failed. Please allow location access and try again.
                </div>
              )}
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("camera")}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 font-semibold text-foreground transition hover:bg-surface-hover disabled:opacity-60"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  <Check size={16} />
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: resultType === "Clock In" ? "var(--chart-blue-soft)" : "var(--chart-orange-soft)",
                  color: resultType === "Clock In" ? "var(--chart-blue)" : "var(--chart-orange)",
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <p className="text-lg font-semibold text-foreground">{resultType} recorded!</p>
              <p className="mt-1 text-sm text-muted">You can close this page now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
