import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { uploadImage } from "@/lib/upload";
import { sendTelegramPhoto } from "@/lib/telegram";
import { requireApiKey } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { employeeId, name, type, imageData, latitude, longitude, timestamp } = body as {
    employeeId: number;
    name: string;
    type: "Clock In" | "Clock Out";
    imageData: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  };

  if (!employeeId || !type || !imageData || latitude == null || longitude == null || !timestamp) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const imageUrl = await uploadImage(imageData);

  const [row] = await sql`
    INSERT INTO attendance_log (employee_id, type, image_url, latitude, longitude, timestamp)
    VALUES (${employeeId}, ${type}, ${imageUrl}, ${latitude}, ${longitude}, ${timestamp})
    RETURNING id
  `;

  await sendTelegramPhoto({ name, type, timestamp, latitude, longitude, photoUrl: imageUrl });

  return NextResponse.json({ id: row.id, imageUrl });
}
