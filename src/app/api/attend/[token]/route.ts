import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getNextAttendanceType } from "@/lib/students";
import { uploadImage } from "@/lib/upload";
import { sendTelegramPhoto } from "@/lib/telegram";

type StudentRow = { id: number; name: string; active: boolean };

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [student] = (await sql`
    SELECT id, name, active FROM students WHERE attendance_token = ${token}
  `) as StudentRow[];

  if (!student || !student.active) {
    return NextResponse.json({ error: "This attendance link is invalid or inactive." }, { status: 404 });
  }

  const body = (await req.json()) as {
    imageData?: string;
    latitude?: number;
    longitude?: number;
    type?: string;
  };

  const { imageData, latitude, longitude, type } = body;
  if (!imageData || latitude == null || longitude == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (type !== "Clock In" && type !== "Clock Out") {
    return NextResponse.json({ error: "Invalid attendance type" }, { status: 400 });
  }

  // staleClockInId flags a forgotten clock-out from a previous day regardless
  // of what the student picks today; the type itself is now the student's choice.
  const { staleClockInId } = await getNextAttendanceType(student.id);

  if (staleClockInId != null) {
    // A previous Clock In was never followed by a Clock Out (student forgot).
    // Today starts fresh instead of forcing a same-day-looking Clock Out for
    // an event that never happened - flag the orphaned record for review.
    await sql`
      UPDATE attendance_log
      SET flagged = TRUE, flag_reason = 'Missing clock-out - no matching Clock Out was recorded before the next Clock In.'
      WHERE id = ${staleClockInId}
    `;
  }

  const imageUrl = await uploadImage(imageData);
  const timestamp = new Date().toISOString();

  await sql`
    INSERT INTO attendance_log (student_id, type, image_url, latitude, longitude, timestamp)
    VALUES (${student.id}, ${type}, ${imageUrl}, ${latitude}, ${longitude}, ${timestamp})
  `;

  await sendTelegramPhoto({ name: student.name, type, timestamp, latitude, longitude, photoUrl: imageUrl });

  return NextResponse.json({ ok: true, type, hadMissedClockOut: staleClockInId != null });
}
