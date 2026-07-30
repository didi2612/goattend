"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Check,
  UserPlus,
  ClipboardEdit,
  Pencil,
  Trash2,
  LogOut,
  LogIn,
  Power,
} from "lucide-react";
import { ManualAttendanceModal } from "@/components/ManualAttendanceModal";
import { EditStudentModal } from "@/components/EditStudentModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DropdownMenu } from "@/components/DropdownMenu";

type Student = {
  id: number;
  name: string;
  owner_id: number;
  owner_name: string;
  attendance_token: string;
  active: boolean;
  created_at: string;
  last_type: "Clock In" | "Clock Out" | null;
};

type Me = { userId: number; email: string; role: "superadmin" | "admin" };

function ClockStatusBadge({ lastType }: { lastType: Student["last_type"] }) {
  if (lastType === "Clock In") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ background: "var(--chart-blue-soft)", color: "var(--chart-blue)" }}
      >
        Clocked In
      </span>
    );
  }
  if (lastType === "Clock Out") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ background: "var(--chart-orange-soft)", color: "var(--chart-orange)" }}
      >
        Clocked Out
      </span>
    );
  }
  return <span className="text-xs text-muted">Never clocked in</span>;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [recordingFor, setRecordingFor] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  async function load() {
    setLoading(true);
    const [studentsRes, meRes] = await Promise.all([
      fetch("/api/admin/students"),
      fetch("/api/me"),
    ]);
    setStudents(await studentsRes.json());
    setMe(await meRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setSubmitting(false);
    load();
  }

  async function toggleActive(id: number, active: boolean) {
    await fetch(`/api/admin/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  async function quickToggleClock(student: Student) {
    const nextType = student.last_type === "Clock In" ? "Clock Out" : "Clock In";
    await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        type: nextType,
        timestamp: new Date().toISOString(),
      }),
    });
    load();
  }

  function copyLink(student: Student) {
    const link = `${window.location.origin}/attend/${student.attendance_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId((id) => (id === student.id ? null : id)), 2000);
  }

  function canManage(student: Student) {
    return me?.role === "superadmin" || me?.userId === student.owner_id;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Students</h1>

      <form onSubmit={addStudent} className="mb-6 flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Student name"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          <UserPlus size={16} />
          Add Student
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Created By</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Attendance Link</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((s) => {
              const isClockedIn = s.last_type === "Clock In";
              return (
                <tr key={s.id} className="transition hover:bg-surface-hover">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted">{s.owner_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <ClockStatusBadge lastType={s.last_type} />
                      {!s.active && (
                        <span className="text-xs text-muted">Enrollment inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyLink(s)}
                      className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                      {copiedId === s.id ? <Check size={14} /> : <Link2 size={14} />}
                      {copiedId === s.id ? "Copied!" : "Copy Link"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {canManage(s) && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => quickToggleClock(s)}
                          title={isClockedIn ? "Clock Out Now" : "Clock In Now"}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-surface-hover"
                          style={{ color: isClockedIn ? "var(--chart-orange)" : "var(--chart-blue)" }}
                        >
                          {isClockedIn ? <LogOut size={16} /> : <LogIn size={16} />}
                        </button>
                        <DropdownMenu
                          items={[
                            {
                              label: "Record Entry",
                              icon: ClipboardEdit,
                              onClick: () => setRecordingFor(s),
                            },
                            { label: "Edit", icon: Pencil, onClick: () => setEditingStudent(s) },
                            {
                              label: s.active ? "Deactivate" : "Activate",
                              icon: Power,
                              onClick: () => toggleActive(s.id, !s.active),
                            },
                            {
                              label: "Delete",
                              icon: Trash2,
                              danger: true,
                              onClick: () => setDeletingStudent(s),
                            },
                          ]}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No students yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {recordingFor && (
        <ManualAttendanceModal
          studentId={recordingFor.id}
          studentName={recordingFor.name}
          onClose={() => setRecordingFor(null)}
          onSaved={load}
        />
      )}

      {editingStudent && (
        <EditStudentModal
          studentId={editingStudent.id}
          currentName={editingStudent.name}
          onClose={() => setEditingStudent(null)}
          onSaved={load}
        />
      )}

      {deletingStudent && (
        <ConfirmDialog
          title="Delete student?"
          message={`This permanently deletes "${deletingStudent.name}" and all of their attendance history. This cannot be undone.`}
          onConfirm={async () => {
            await fetch(`/api/admin/students/${deletingStudent.id}`, { method: "DELETE" });
            load();
          }}
          onClose={() => setDeletingStudent(null)}
        />
      )}
    </div>
  );
}
