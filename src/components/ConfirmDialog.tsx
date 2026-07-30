"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl"
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <p className="mb-4 text-sm text-muted">{message}</p>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
