import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getStudentsMissingClockOutToday } from "@/lib/students";
import { sendFlaggedAttendanceAlert } from "@/lib/email";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getStudentsMissingClockOutToday();

  const byOwner = new Map<
    number,
    { ownerName: string; ownerEmail: string; studentNames: string[]; attendanceLogIds: number[] }
  >();
  for (const row of rows) {
    const entry = byOwner.get(row.ownerId) ?? {
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      studentNames: [],
      attendanceLogIds: [],
    };
    entry.studentNames.push(row.studentName);
    entry.attendanceLogIds.push(row.attendanceLogId);
    byOwner.set(row.ownerId, entry);
  }

  let sent = 0;
  let failed = 0;
  for (const { ownerName, ownerEmail, studentNames, attendanceLogIds } of byOwner.values()) {
    try {
      await sendFlaggedAttendanceAlert({ email: ownerEmail, ownerName, studentNames });
      await sql`
        UPDATE attendance_log
        SET flagged = TRUE, flag_reason = 'Missing clock-out - supervisor notified by email at 10pm.'
        WHERE id = ANY(${attendanceLogIds})
      `;
      sent++;
    } catch (err) {
      failed++;
      console.error(`Failed to send flagged attendance alert to owner ${ownerEmail}:`, err);
    }
  }

  return NextResponse.json({ studentsFlagged: rows.length, supervisorsNotified: sent, failed });
}
