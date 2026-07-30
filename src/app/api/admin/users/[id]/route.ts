import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active, role, name, email } = (await req.json()) as {
    active?: boolean;
    role?: "superadmin" | "admin";
    name?: string;
    email?: string;
  };

  const session = await getServerSession();
  if (session && Number(id) === session.userId && (active === false || role === "admin")) {
    return NextResponse.json({ error: "You cannot demote or deactivate your own account" }, {
      status: 400,
    });
  }

  if (active === undefined && role === undefined && name === undefined && email === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  if (role !== undefined && role !== "superadmin" && role !== "admin") {
    return NextResponse.json({ error: "Role must be superadmin or admin" }, { status: 400 });
  }
  if (email !== undefined && !email.trim()) {
    return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
  }
  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }

  try {
    const [user] = (await sql`
      UPDATE users SET
        active = COALESCE(${active ?? null}, active),
        role = COALESCE(${role ?? null}, role),
        name = COALESCE(${name?.trim() ?? null}, name),
        email = COALESCE(${email?.trim().toLowerCase() ?? null}, email)
      WHERE id = ${Number(id)}
      RETURNING id, email, name, role, active, created_at
    `) as unknown[];

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const targetId = Number(id);

  if (targetId === session.userId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const [{ count: ownedStudents }] = (await sql`
    SELECT COUNT(*)::int AS count FROM students WHERE owner_id = ${targetId}
  `) as { count: number }[];

  if (ownedStudents > 0) {
    return NextResponse.json(
      {
        error: `This admin still owns ${ownedStudents} student${ownedStudents === 1 ? "" : "s"}. Delete those students first (or transfer them to another admin, once that's supported).`,
      },
      { status: 409 },
    );
  }

  const result = await sql`DELETE FROM users WHERE id = ${targetId} RETURNING id`;
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
