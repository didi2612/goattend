"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

type Student = { id: number; name: string; attendance_token: string };

export function StudentLinksList({ students }: { students: Student[] }) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function copyLink(student: Student) {
    const link = `${window.location.origin}/attend/${student.attendance_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId((id) => (id === student.id ? null : id)), 2000);
  }

  if (students.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No students yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {students.map((s) => (
        <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
          <span className="font-medium text-foreground">{s.name}</span>
          <button
            onClick={() => copyLink(s)}
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            {copiedId === s.id ? <Check size={14} /> : <Link2 size={14} />}
            {copiedId === s.id ? "Copied!" : "Copy Link"}
          </button>
        </li>
      ))}
    </ul>
  );
}
