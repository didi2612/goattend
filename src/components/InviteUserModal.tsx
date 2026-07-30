"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

type Student = { id: number; name: string; owner_name: string };

export function InviteUserModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/students")
      .then((res) => res.json())
      .then(setStudents)
      .catch(() => {});
  }, []);

  function toggleStudent(id: number) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const groupedStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    const filtered = q
      ? students.filter(
          (s) => s.name.toLowerCase().includes(q) || s.owner_name.toLowerCase().includes(q),
        )
      : students;

    const byOwner = new Map<string, Student[]>();
    for (const s of filtered) {
      const list = byOwner.get(s.owner_name) ?? [];
      list.push(s);
      byOwner.set(s.owner_name, list);
    }
    return [...byOwner.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [students, studentSearch]);

  async function save() {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          name: name.trim() || null,
          role,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to invite user");
        return;
      }

      const newUser = (await res.json()) as { id: number };
      if (role === "admin" && selectedStudentIds.size > 0) {
        await fetch(`/api/admin/users/${newUser.id}/access-grants`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: [...selectedStudentIds] }),
        });
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
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-surface shadow-2xl"
      >
        <div className="overflow-y-auto p-6">
          <h3 className="mb-1 text-lg font-bold text-foreground">Invite Supervisor</h3>
          <p className="mb-4 text-sm text-muted">
            They&apos;ll get an email with a link to set their password, then log in with the
            username below.
          </p>

          <label className="mb-1 block text-sm font-medium text-foreground">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. jane"
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
          />

          <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mb-1 block text-sm font-medium text-foreground">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mb-1 block text-sm font-medium text-foreground">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="admin">Admin (supervisor)</option>
            <option value="superadmin">Superadmin</option>
          </select>

          {role === "admin" && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Grant access to existing students{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <p className="mb-2 text-xs text-muted">
                They&apos;ll always see students they create themselves. Pick any existing ones
                to share now, or do it later from Manage Access.
              </p>

              {students.length > 0 && (
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              <div className="max-h-40 space-y-3 overflow-y-auto rounded-lg border border-border p-2">
                {groupedStudents.map(([ownerName, list]) => (
                  <div key={ownerName}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      {ownerName}&apos;s students
                    </p>
                    <div className="space-y-0.5">
                      {list.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-foreground hover:bg-surface-hover"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(s.id)}
                            onChange={() => toggleStudent(s.id)}
                            className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {groupedStudents.length === 0 && (
                  <p className="px-2 py-1 text-sm text-muted">No students yet.</p>
                )}
              </div>
            </div>
          )}

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-6 pt-4">
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
            {saving ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
