"use client";

import { useEffect, useState } from "react";

type User = { id: number; email: string; name: string | null; role: "superadmin" | "admin" };

export function AccessGrantsModal({
  grantee,
  allUsers,
  onClose,
}: {
  grantee: User;
  allUsers: User[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const otherAdmins = allUsers.filter((u) => u.id !== grantee.id);

  useEffect(() => {
    fetch(`/api/admin/users/${grantee.id}/access-grants`)
      .then((res) => res.json())
      .then((ids: number[]) => setSelected(new Set(ids)))
      .finally(() => setLoading(false));
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
    await fetch(`/api/admin/users/${grantee.id}/access-grants`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetAdminIds: [...selected] }),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
      >
        <h3 className="mb-1 text-lg font-bold text-foreground">Manage Access</h3>
        <p className="mb-4 text-sm text-muted">
          Choose which other admins&apos; students <span className="font-medium text-foreground">{grantee.email}</span>{" "}
          can also view, in addition to their own.
        </p>

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : (
          <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
            {otherAdmins.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  onChange={() => toggle(u.id)}
                  className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                />
                {u.email} <span className="text-muted">({u.role})</span>
              </label>
            ))}
            {otherAdmins.length === 0 && (
              <p className="text-sm text-muted">No other admins yet.</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
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
  );
}
