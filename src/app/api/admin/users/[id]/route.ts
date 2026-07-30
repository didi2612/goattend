import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active, role } = (await req.json()) as {
    active?: boolean;
    role?: "superadmin" | "admin";
  };

  const session = await getServerSession();
  if (session && Number(id) === session.userId && (active === false || role === "admin")) {
    return NextResponse.json({ error: "You cannot demote or deactivate your own account" }, {
      status: 400,
    });
  }

  if (active === undefined && role === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  if (role !== undefined && role !== "superadmin" && role !== "admin") {
    return NextResponse.json({ error: "Role must be superadmin or admin" }, { status: 400 });
  }

  const [user] = (await sql`
    UPDATE users SET
      active = COALESCE(${active ?? null}, active),
      role = COALESCE(${role ?? null}, role)
    WHERE id = ${Number(id)}
    RETURNING id, email, name, role, active, created_at
  `) as unknown[];

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}
