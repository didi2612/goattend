import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const employees = await sql`
    SELECT id, name, active, created_at FROM employees ORDER BY name
  `;
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const { name } = (await req.json()) as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [employee] = await sql`
    INSERT INTO employees (name) VALUES (${name.trim()})
    ON CONFLICT (name) DO UPDATE SET active = TRUE
    RETURNING id, name, active, created_at
  `;
  return NextResponse.json(employee);
}
