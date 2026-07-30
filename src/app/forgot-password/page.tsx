"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Forgot Password">
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <MailCheck className="text-accent" size={28} />
          <p className="text-sm text-muted">
            If an account exists for that email, a reset link has been sent.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <Link href="/login" className="mt-4 block text-center text-sm text-accent hover:underline">
        Back to login
      </Link>
    </AuthShell>
  );
}
