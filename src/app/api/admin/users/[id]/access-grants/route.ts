import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grants = await sql`
    SELECT student_id FROM student_access_grants WHERE grantee_admin_id = ${Number(id)}
  `;
  return NextResponse.json((grants as { student_id: number }[]).map((g) => g.student_id));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const granteeId = Number(id);
  const { studentIds } = (await req.json()) as { studentIds?: number[] };

  if (!Array.isArray(studentIds)) {
    return NextResponse.json({ error: "studentIds must be an array" }, { status: 400 });
  }

  // Students the grantee already owns don't need (and shouldn't get) an
  // explicit grant row - ownership already implies visibility.
  const owned = (await sql`
    SELECT id FROM students WHERE owner_id = ${granteeId}
  `) as { id: number }[];
  const ownedIds = new Set(owned.map((s) => s.id));
  const ids = studentIds.filter((sid) => !ownedIds.has(sid));

  await sql`DELETE FROM student_access_grants WHERE grantee_admin_id = ${granteeId}`;
  for (const studentId of ids) {
    await sql`
      INSERT INTO student_access_grants (grantee_admin_id, student_id)
      VALUES (${granteeId}, ${studentId})
      ON CONFLICT DO NOTHING
    `;
  }

  return NextResponse.json({ ok: true });
}
