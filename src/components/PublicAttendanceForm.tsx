"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  token: string;
  studentName: string;
  nextType: "Clock In" | "Clock Out";
};

type Step = "camera" | "confirm" | "done";

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
    <div
      className="min-h-screen p-5"
      style={{ background: "linear-gradient(to bottom right, #f0f4ff, #dfe9f3)" }}
    >
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-1 text-center text-xl font-bold text-slate-900">AZP Attendance</h1>
        <p className="mb-5 text-center text-sm text-slate-500">{studentName}</p>

        {step === "camera" && (
          <div>
            {photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoDataUrl} alt="Selfie preview" className="mb-4 aspect-[4/3] w-full rounded-xl object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="mb-4 aspect-[4/3] w-full rounded-xl bg-slate-200 object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            {photoDataUrl ? (
              <div className="flex gap-3">
                <button
                  onClick={retake}
                  className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700"
                >
                  🔄 Retake
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Next ➡️
                </button>
              </div>
            ) : (
              <button
                onClick={snap}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Snap Photo
              </button>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div>
            {photoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoDataUrl} alt="Selfie preview" className="mb-4 aspect-[4/3] w-full rounded-xl object-cover" />
            )}
            <p className="mb-4 text-center text-base text-slate-700">
              Confirm <span className="font-bold">{nextType}</span> for{" "}
              <span className="font-bold">{studentName}</span>?
            </p>

            {locationStatus === "error" && (
              <p className="mb-4 text-center text-sm text-red-600">
                ❌ Location fetch failed. Please allow location access and try again.
              </p>
            )}
            {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("camera")}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 disabled:opacity-60"
              >
                ⬅️ Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "✅ Submit"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center">
            <p className="mb-2 text-2xl">✅</p>
            <p className="text-lg font-semibold text-slate-900">{resultType} recorded!</p>
            <p className="mt-1 text-sm text-slate-500">You can close this page now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
