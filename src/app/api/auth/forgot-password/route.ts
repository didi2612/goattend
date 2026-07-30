import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };

  // Always respond the same way regardless of whether the account exists,
  // to avoid leaking which emails are registered.
  const genericResponse = NextResponse.json({ ok: true });

  if (!email) return genericResponse;

  const [user] = (await sql`
    SELECT id FROM users WHERE email = ${email.toLowerCase()} AND active = TRUE AND password_hash IS NOT NULL
  `) as { id: number }[];

  if (!user) return genericResponse;

  const token = await createAuthToken(user.id, "reset");
  try {
    await sendResetEmail({ email: email.toLowerCase(), token });
  } catch (err) {
    console.error("Failed to send reset email:", err);
  }

  return genericResponse;
}
