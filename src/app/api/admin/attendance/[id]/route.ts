import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/session";
import { canManageStudent } from "@/lib/access";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { remarks } = (await req.json()) as { remarks?: string | null };

  const [record] = (await sql`
    SELECT a.id, s.owner_id
    FROM attendance_log a
    JOIN students s ON s.id = a.student_id
    WHERE a.id = ${Number(id)}
  `) as { id: number; owner_id: number }[];

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageStudent(session, record.owner_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await sql`
    UPDATE attendance_log SET remarks = ${remarks?.trim() || null}
    WHERE id = ${Number(id)}
    RETURNING id, remarks
  `;
  return NextResponse.json(updated);
}
