import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendInviteEmail } from "@/lib/email";

export async function GET() {
  const users = await sql`
    SELECT id, email, name, role, active, (password_hash IS NOT NULL) AS activated, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { email, name, role } = (await req.json()) as {
    email?: string;
    name?: string;
    role?: "superadmin" | "admin";
  };

  if (!email || !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (role !== "superadmin" && role !== "admin") {
    return NextResponse.json({ error: "Role must be superadmin or admin" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [user] = (await sql`
    INSERT INTO users (email, name, role)
    VALUES (${normalizedEmail}, ${name?.trim() || null}, ${role})
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, name, role, active, created_at
  `) as { id: number; email: string; name: string | null; role: string }[];

  if (!user) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

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
}
