import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const unauthorized = requireApiKey(req);
  if (unauthorized) return unauthorized;

  const employees = await sql`
    SELECT id, name FROM employees WHERE active = TRUE ORDER BY name
  `;
  return NextResponse.json(employees);
}
