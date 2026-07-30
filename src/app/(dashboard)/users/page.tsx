"use client";

import { useEffect, useState } from "react";
import { UserPlus, Send, ShieldCheck, Pencil, Trash2, Power, Users } from "lucide-react";
import { AccessGrantsModal } from "@/components/AccessGrantsModal";
import { EditUserModal } from "@/components/EditUserModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DropdownMenu, type MenuItem } from "@/components/DropdownMenu";

type User = {
  id: number;
  email: string;
  name: string | null;
  role: "superadmin" | "admin";
  active: boolean;
  activated: boolean;
  created_at: string;
};

type Me = { userId: number; email: string; role: "superadmin" | "admin" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [managingAccessFor, setManagingAccessFor] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  async function load() {
    setLoading(true);
    const [usersRes, meRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/me")]);
    setUsers(await usersRes.json());
    setMe(await meRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function inviteUser(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim() || null, role }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to invite user");
      return;
    }

    setEmail("");
    setName("");
    setRole("admin");
    setNotice("Invite sent.");
    load();
  }

  async function toggleActive(id: number, active: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  async function resendInvite(id: number) {
    setNotice(null);
    const res = await fetch(`/api/admin/users/${id}/resend-invite`, { method: "POST" });
    if (res.ok) setNotice("Invite resent.");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Supervisor Accounts
      </h1>

      <form onSubmit={inviteUser} className="mb-6 flex flex-wrap gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="min-w-[220px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="min-w-[160px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="admin">Admin (supervisor)</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          <UserPlus size={16} />
          Invite
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {notice && <p className="mb-4 text-sm text-emerald-500">{notice}</p>}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="transition hover:bg-surface-hover">
                <td className="px-4 py-3 font-medium text-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted">{u.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-muted capitalize">
                    {u.role === "superadmin" && <ShieldCheck size={13} className="text-accent" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-surface-hover text-muted"
                    }`}
                  >
                    {u.active ? "Active" : "Deactivated"}
                  </span>
                  {!u.activated && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Pending invite
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingUser(u)}
                      title="Edit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-foreground"
                    >
                      <Pencil size={15} />
                    </button>
                    <DropdownMenu
                      items={
                        [
                          u.role === "admin" && {
                            label: "Manage Access",
                            icon: Users,
                            onClick: () => setManagingAccessFor(u),
                          },
                          !u.activated && {
                            label: "Resend Invite",
                            icon: Send,
                            onClick: () => resendInvite(u.id),
                          },
                          u.id !== me?.userId && {
                            label: u.active ? "Deactivate" : "Activate",
                            icon: Power,
                            onClick: () => toggleActive(u.id, !u.active),
                          },
                          u.id !== me?.userId && {
                            label: "Delete",
                            icon: Trash2,
                            danger: true,
                            onClick: () => setDeletingUser(u),
                          },
                        ].filter(Boolean) as MenuItem[]
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No supervisor accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {managingAccessFor && (
        <AccessGrantsModal
          grantee={managingAccessFor}
          allUsers={users}
          onClose={() => setManagingAccessFor(null)}
        />
      )}

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={load} />
      )}

      {deletingUser && (
        <ConfirmDialog
          title="Delete user?"
          message={`This permanently deletes the account for "${deletingUser.email}". This cannot be undone.`}
          onConfirm={async () => {
            const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: "DELETE" });
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              throw new Error(data?.error ?? "Failed to delete user");
            }
            load();
          }}
          onClose={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}
