"use client";

import { useState } from "react";

type ClockType = "Clock In" | "Clock Out";

function toLocalDatetimeValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ManualAttendanceModal({
  studentId,
  studentName,
  onClose,
  onSaved,
}: {
  studentId: number;
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<ClockType>("Clock In");
  const [datetime, setDatetime] = useState(() => toLocalDatetimeValue(new Date()));
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          type,
          timestamp: new Date(datetime).toISOString(),
          remarks: remarks.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to save");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl"
      >
        <h3 className="mb-1 text-lg font-bold text-foreground">Record Attendance</h3>
        <p className="mb-4 text-sm text-muted">
          Manually add a clock event for <span className="font-medium text-foreground">{studentName}</span>.
        </p>

        <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ClockType)}
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="Clock In">Clock In</option>
          <option value="Clock Out">Clock Out</option>
        </select>

        <label className="mb-1 block text-sm font-medium text-foreground">Date &amp; Time</label>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <label className="mb-1 block text-sm font-medium text-foreground">Remarks (optional)</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          placeholder="e.g. Left early for a doctor's appointment"
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
