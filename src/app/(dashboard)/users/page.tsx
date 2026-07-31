"use client";

import { useEffect, useState } from "react";
import { UserPlus, Send, ShieldCheck, Pencil, Trash2, Power, Users, KeyRound } from "lucide-react";
import { AccessGrantsModal } from "@/components/AccessGrantsModal";
import { EditUserModal } from "@/components/EditUserModal";
import { InviteUserModal } from "@/components/InviteUserModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DropdownMenu, type MenuItem } from "@/components/DropdownMenu";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 7;

type User = {
  id: number;
  username: string;
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
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const [inviting, setInviting] = useState(false);
  const [managingAccessFor, setManagingAccessFor] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);

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
    setNotice(
      res.ok ? { text: "Invite resent.", isError: false } : { text: "Failed to resend invite.", isError: true },
    );
  }

  async function sendReset(id: number) {
    setNotice(null);
    const res = await fetch(`/api/admin/users/${id}/send-reset`, { method: "POST" });
    if (res.ok) {
      setNotice({
        text: "Reset link sent. Their current password still works until they use it.",
        isError: false,
      });
    } else {
      const data = await res.json().catch(() => null);
      setNotice({ text: data?.error ?? "Failed to send reset link.", isError: true });
    }
  }

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Supervisor Accounts"
        description="Invite admins and superadmins to help manage students."
        action={
          <button
            onClick={() => setInviting(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            <UserPlus size={16} />
            Invite
          </button>
        }
      />

      {notice && (
        <p className={`mb-4 text-sm ${notice.isError ? "text-red-500" : "text-emerald-500"}`}>
          {notice.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagedUsers.map((u) => (
              <tr key={u.id} className="transition hover:bg-surface-hover">
                <td className="px-4 py-3 font-medium text-foreground">{u.username}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 text-muted">{u.name ?? "-"}</td>
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
                          u.activated && {
                            label: "Send Reset Password",
                            icon: KeyRound,
                            onClick: () => sendReset(u.id),
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
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No supervisor accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />

      {inviting && <InviteUserModal onClose={() => setInviting(false)} onSaved={load} />}

      {managingAccessFor && (
        <AccessGrantsModal
          grantee={managingAccessFor}
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
