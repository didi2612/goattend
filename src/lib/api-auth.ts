import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export function requireApiKey(req: NextRequest): NextResponse | null {
  const expected = process.env.APP_API_KEY;
  if (!expected) throw new Error("APP_API_KEY is not set");

  const provided = req.headers.get("x-api-key") ?? "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  const valid =
    expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
