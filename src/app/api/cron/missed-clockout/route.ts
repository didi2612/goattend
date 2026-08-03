import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getStudentsMissingClockOutToday } from "@/lib/students";
import { sendMissedClockOutEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await getStudentsMissingClockOutToday();

  let sent = 0;
  let failed = 0;
  for (const student of students) {
    try {
      await sendMissedClockOutEmail({ email: student.email, name: student.name });
      await sql`
        UPDATE attendance_log
        SET flagged = TRUE, flag_reason = 'Missing clock-out - notified by email at 10pm.'
        WHERE id = ${student.attendanceLogId}
      `;
      sent++;
    } catch (err) {
      failed++;
      console.error(`Failed to notify student ${student.id} of missed clock-out:`, err);
    }
  }

  return NextResponse.json({ checked: students.length, sent, failed });
}
