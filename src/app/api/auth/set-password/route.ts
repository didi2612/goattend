import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/password";
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { token, password } = (await req.json()) as { token?: string; password?: string };

  if (!token || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Invalid request. Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const authToken = await consumeAuthToken(token);
  if (!authToken) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const [user] = (await sql`
    UPDATE users SET password_hash = ${passwordHash}
    WHERE id = ${authToken.user_id}
    RETURNING id, username, email, role
  `) as { id: number; username: string; email: string; role: "superadmin" | "admin" }[];

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const sessionToken = await createSessionToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return res;
}
