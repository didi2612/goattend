import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
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
  };

  const { imageData, latitude, longitude } = body;
  if (!imageData || latitude == null || longitude == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // The type is always derived server-side from the student's last record,
  // never trusted from the client, so a submission can't be spoofed as the
  // wrong clock event.
  const [lastRecord] = (await sql`
    SELECT type FROM attendance_log WHERE student_id = ${student.id} ORDER BY timestamp DESC LIMIT 1
  `) as { type: "Clock In" | "Clock Out" }[];
  const type: "Clock In" | "Clock Out" = lastRecord?.type === "Clock In" ? "Clock Out" : "Clock In";

  const imageUrl = await uploadImage(imageData);
  const timestamp = new Date().toISOString();

  await sql`
    INSERT INTO attendance_log (student_id, type, image_url, latitude, longitude, timestamp)
    VALUES (${student.id}, ${type}, ${imageUrl}, ${latitude}, ${longitude}, ${timestamp})
  `;

  await sendTelegramPhoto({ name: student.name, type, timestamp, latitude, longitude, photoUrl: imageUrl });

  return NextResponse.json({ ok: true, type });
}
