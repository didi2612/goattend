import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/session";
import { canManageStudent } from "@/lib/access";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, type, timestamp, remarks } = (await req.json()) as {
    studentId?: number;
    type?: "Clock In" | "Clock Out";
    timestamp?: string;
    remarks?: string;
  };

  if (!studentId || (type !== "Clock In" && type !== "Clock Out")) {
    return NextResponse.json({ error: "studentId and a valid type are required" }, { status: 400 });
  }

  const [student] = (await sql`
    SELECT id, name, owner_id FROM students WHERE id = ${studentId}
  `) as { id: number; name: string; owner_id: number }[];

  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageStudent(session, student.owner_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const effectiveTimestamp = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

  const [record] = await sql`
    INSERT INTO attendance_log (student_id, type, timestamp, source, recorded_by, remarks)
    VALUES (${studentId}, ${type}, ${effectiveTimestamp}, 'manual', ${session.userId}, ${remarks?.trim() || null})
    RETURNING id, student_id, type, timestamp, source, remarks
  `;

  await sendTelegramMessage({
    name: student.name,
    type,
    timestamp: effectiveTimestamp,
    recordedByEmail: session.email,
  });

  return NextResponse.json(record);
}
