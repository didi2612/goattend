"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Set Your Password">
        <p className="text-center text-sm text-muted">Missing or invalid link.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set Your Password">
      <form onSubmit={handleSubmit}>
        <label className="mb-1 block text-sm font-medium text-foreground">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="new-password"
          required
        />

        <label className="mb-1 block text-sm font-medium text-foreground">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="new-password"
          required
        />

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-2.5 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Set Password & Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}
