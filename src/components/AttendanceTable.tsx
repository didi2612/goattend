"use client";

import { useEffect, useState } from "react";
import type { AttendanceRecord } from "@/lib/queries";

export function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (!selected) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image_url}
                    alt={r.employee_name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {r.employee_name}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.type}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {new Date(r.timestamp).toLocaleString("en-MY")}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:underline"
                  >
                    View on Map
                  </a>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
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
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
          >
            <div className="relative bg-slate-100 dark:bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.image_url}
                alt={selected.employee_name}
                className="max-h-[60vh] w-full object-contain"
              />
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {selected.employee_name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">Type:</span> {selected.type}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">Time:</span>{" "}
                {new Date(selected.timestamp).toLocaleString("en-MY")}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">Coordinates:</span> {selected.latitude},{" "}
                {selected.longitude}
              </p>
              <a
                href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block pt-1 text-sm font-medium text-blue-600 hover:underline"
              >
                View on Map →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
