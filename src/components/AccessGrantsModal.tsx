"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Lock } from "lucide-react";

type User = { id: number; email: string; name: string | null; role: "superadmin" | "admin" };
type Student = {
  id: number;
  name: string;
  owner_id: number;
  owner_name: string;
  active: boolean;
};

export function AccessGrantsModal({
  grantee,
  onClose,
}: {
  grantee: User;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/students").then((res) => res.json()),
      fetch(`/api/admin/users/${grantee.id}/access-grants`).then((res) => res.json()),
    ]).then(([allStudents, grantedIds]: [Student[], number[]]) => {
      setStudents(allStudents);
      const ownIds = allStudents.filter((s) => s.owner_id === grantee.id).map((s) => s.id);
      setSelected(new Set([...grantedIds, ...ownIds]));
      setLoading(false);
    });
  }, [grantee.id]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${grantee.id}/access-grants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: [...selected] }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? students.filter(
          (s) => s.name.toLowerCase().includes(q) || s.owner_name.toLowerCase().includes(q),
        )
      : students;

    const own = filtered.filter((s) => s.owner_id === grantee.id);
    const others = filtered.filter((s) => s.owner_id !== grantee.id);

    const byOwner = new Map<string, Student[]>();
    for (const s of others) {
      const list = byOwner.get(s.owner_name) ?? [];
      list.push(s);
      byOwner.set(s.owner_name, list);
    }

    return {
      own,
      otherGroups: [...byOwner.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [students, search, grantee.id]);

  const grantedOtherCount = [...selected].filter(
    (id) => !students.find((s) => s.id === id && s.owner_id === grantee.id),
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-surface shadow-2xl"
      >
        <div className="border-b border-border p-6 pb-4">
          <h3 className="mb-1 text-lg font-bold text-foreground">Manage Access</h3>
          <p className="text-sm text-muted">
            Choose which students <span className="font-medium text-foreground">{grantee.email}</span>{" "}
            can view, in addition to the ones they created themselves.
          </p>

          <div className="relative mt-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students or admins..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 py-4">
          {loading ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : (
            <div className="space-y-5">
              {groups.own.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Their own students
                  </p>
                  <div className="space-y-1">
                    {groups.own.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground"
                      >
                        <input type="checkbox" checked disabled className="h-4 w-4 rounded border-border" />
                        {s.name}
                        <Lock size={12} className="ml-auto text-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {groups.otherGroups.map(([ownerName, list]) => (
                <div key={ownerName}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {ownerName}&apos;s students
                  </p>
                  <div className="space-y-1">
                    {list.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-surface-hover"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                        />
                        {s.name}
                        {!s.active && <span className="text-xs text-muted">(inactive)</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {groups.own.length === 0 && groups.otherGroups.length === 0 && (
                <p className="text-sm text-muted">No students match your search.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border p-6 pt-4">
          <p className="text-xs text-muted">{grantedOtherCount} extra student(s) granted</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
