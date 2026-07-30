"use client";

import { useEffect, useState } from "react";
import { X, MapPin, LogIn, LogOut, ClipboardEdit, ImageOff, MessageSquare } from "lucide-react";
import type { AttendanceRecord } from "@/lib/queries";

type Me = { userId: number; email: string; role: "superadmin" | "admin" };

function TypeBadge({ type }: { type: AttendanceRecord["type"] }) {
  const isIn = type === "Clock In";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        background: isIn ? "var(--chart-blue-soft)" : "var(--chart-orange-soft)",
        color: isIn ? "var(--chart-blue)" : "var(--chart-orange)",
      }}
    >
      {isIn ? <LogIn size={12} /> : <LogOut size={12} />}
      {type}
    </span>
  );
}

function ManualBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
      <ClipboardEdit size={11} />
      Manual
    </span>
  );
}

function RemarksEditor({
  record,
  canManage,
  onSaved,
}: {
  record: AttendanceRecord;
  canManage: boolean;
  onSaved: (remarks: string | null) => void;
}) {
  const [value, setValue] = useState(record.remarks ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(record.remarks ?? "");
  }, [record.id, record.remarks]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/attendance/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: value }),
      });
      if (res.ok) {
        const data = await res.json();
        onSaved(data.remarks);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <div>
        <p className="mb-1 text-sm font-medium text-foreground">Remarks</p>
        <p className="text-sm text-muted">{record.remarks || "No remarks."}</p>
      </div>
    );
  }

  const changed = value !== (record.remarks ?? "");

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-foreground">Remarks</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        placeholder="Add a note about this attendance record..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {changed && (
        <button
          onClick={save}
          disabled={saving}
          className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Remarks"}
        </button>
      )}
    </div>
  );
}

export function AttendanceTable({ records: initialRecords }: { records: AttendanceRecord[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then(setMe);
  }, []);

  useEffect(() => {
    if (!selected) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  function canManage(record: AttendanceRecord) {
    return me?.role === "superadmin" || me?.userId === record.student_owner_id;
  }

  function handleRemarksSaved(id: number, remarks: string | null) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, remarks } : r)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, remarks } : prev));
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className="cursor-pointer transition hover:bg-surface-hover"
              >
                <td className="px-4 py-3">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image_url}
                      alt={r.student_name}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-hover text-muted">
                      <ImageOff size={16} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{r.student_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={r.type} />
                    {r.source === "manual" && <ManualBadge />}
                    {r.remarks && <MessageSquare size={13} className="text-muted" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(r.timestamp).toLocaleString("en-MY")}
                </td>
                <td className="px-4 py-3">
                  {r.latitude != null && r.longitude != null ? (
                    <a
                      href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      <MapPin size={13} />
                      Map
                    </a>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-2xl"
          >
            <div className="relative bg-background">
              {selected.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.image_url}
                  alt={selected.student_name}
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted">
                  <ImageOff size={28} />
                  <p className="text-sm">No photo (manual entry)</p>
                </div>
              )}
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{selected.student_name}</h3>
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={selected.type} />
                  {selected.source === "manual" && <ManualBadge />}
                </div>
              </div>
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Time:</span>{" "}
                {new Date(selected.timestamp).toLocaleString("en-MY")}
              </p>
              {selected.latitude != null && selected.longitude != null ? (
                <>
                  <p className="text-sm text-muted">
                    <span className="font-medium text-foreground">Coordinates:</span>{" "}
                    {selected.latitude}, {selected.longitude}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    <MapPin size={14} />
                    View on Map
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted">No location data (manually recorded).</p>
              )}

              <div className="border-t border-border pt-3">
                <RemarksEditor
                  record={selected}
                  canManage={canManage(selected)}
                  onSaved={(remarks) => handleRemarksSaved(selected.id, remarks)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
