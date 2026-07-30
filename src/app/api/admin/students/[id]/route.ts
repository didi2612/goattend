import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/session";
import { canManageStudent } from "@/lib/access";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { active, name } = (await req.json()) as { active?: boolean; name?: string };

  if (active === undefined && name === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }

  const [student] = (await sql`
    SELECT id, owner_id FROM students WHERE id = ${Number(id)}
  `) as { id: number; owner_id: number }[];

  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageStudent(session, student.owner_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await sql`
    UPDATE students SET
      active = COALESCE(${active ?? null}, active),
      name = COALESCE(${name?.trim() ?? null}, name)
    WHERE id = ${Number(id)}
    RETURNING id, name, owner_id, attendance_token, active, created_at
  `;
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [student] = (await sql`
    SELECT id, owner_id FROM students WHERE id = ${Number(id)}
  `) as { id: number; owner_id: number }[];

  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageStudent(session, student.owner_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await sql`DELETE FROM students WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
