"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  name: string | null;
  role: "superadmin" | "admin";
  active: boolean;
  activated: boolean;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
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
      <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Supervisor Accounts
      </h2>

      <form onSubmit={inviteUser} className="mb-6 flex flex-wrap gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="min-w-[160px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="admin">Admin (supervisor)</option>
          <option value="superadmin">Superadmin</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Invite
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && <p className="mb-4 text-sm text-green-600 dark:text-green-400">{notice}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {u.email}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {u.active ? "Active" : "Deactivated"}
                  </span>
                  {!u.activated && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                      Pending invite
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleActive(u.id, !u.active)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                    {!u.activated && (
                      <button
                        onClick={() => resendInvite(u.id)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Resend Invite
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No supervisor accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
