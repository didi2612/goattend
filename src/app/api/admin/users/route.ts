import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendInviteEmail } from "@/lib/email";

export async function GET() {
  const users = await sql`
    SELECT id, username, email, name, role, active, (password_hash IS NOT NULL) AS activated, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { username, email, name, role } = (await req.json()) as {
    username?: string;
    email?: string;
    name?: string;
    role?: "superadmin" | "admin";
  };

  if (!username || !username.trim()) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }
  if (!email || !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (role !== "superadmin" && role !== "admin") {
    return NextResponse.json({ error: "Role must be superadmin or admin" }, { status: 400 });
  }

  const normalizedUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(normalizedUsername)) {
    return NextResponse.json(
      { error: "Username can only contain lowercase letters, numbers, - and _" },
      { status: 400 },
    );
  }
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [user] = (await sql`
      INSERT INTO users (username, email, name, role)
      VALUES (${normalizedUsername}, ${normalizedEmail}, ${name?.trim() || null}, ${role})
      RETURNING id, username, email, name, role, active, created_at
    `) as { id: number; username: string; email: string; name: string | null; role: string }[];

    const token = await createAuthToken(user.id, "invite");

    try {
      await sendInviteEmail({ email: user.email, name: user.name, token });
    } catch (err) {
      return NextResponse.json(
        { ...user, emailError: err instanceof Error ? err.message : "Failed to send invite email" },
        { status: 201 },
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return NextResponse.json(
        { error: "A user with this username or email already exists" },
        { status: 409 },
      );
    }
    throw err;
  }
}
