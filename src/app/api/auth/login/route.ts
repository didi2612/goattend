import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/session";

type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string | null;
  role: "superadmin" | "admin";
  active: boolean;
};

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json()) as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const [user] = (await sql`
    SELECT id, username, email, password_hash, role, active FROM users
    WHERE username = ${username.toLowerCase()}
  `) as UserRow[];

  if (!user || !user.active || !user.password_hash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return res;
}
