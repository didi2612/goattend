"use client";

import { useState } from "react";

type User = { id: number; email: string; name: string | null };

export function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!email.trim()) {
      setError("Email cannot be empty");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, email: email.trim() }),
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
        <h3 className="mb-4 text-lg font-bold text-foreground">Edit User</h3>

        <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
