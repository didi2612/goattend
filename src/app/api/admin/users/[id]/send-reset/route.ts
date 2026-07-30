import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendResetEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user] = (await sql`
    SELECT id, username, email, (password_hash IS NOT NULL) AS activated
    FROM users WHERE id = ${Number(id)}
  `) as { id: number; username: string; email: string; activated: boolean }[];

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!user.activated) {
    return NextResponse.json(
      { error: "This account hasn't set a password yet - use Resend Invite instead." },
      { status: 400 },
    );
  }

  const token = await createAuthToken(user.id, "reset");

  try {
    await sendResetEmail({ email: user.email, username: user.username, token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send reset email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
