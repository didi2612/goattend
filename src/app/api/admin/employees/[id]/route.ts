import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active } = (await req.json()) as { active?: boolean };
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "active must be a boolean" }, { status: 400 });
  }

  const [employee] = await sql`
    UPDATE employees SET active = ${active} WHERE id = ${Number(id)}
    RETURNING id, name, active, created_at
  `;
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(employee);
}
