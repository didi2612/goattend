import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grants = await sql`
    SELECT target_admin_id FROM admin_access_grants WHERE grantee_admin_id = ${Number(id)}
  `;
  return NextResponse.json((grants as { target_admin_id: number }[]).map((g) => g.target_admin_id));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const granteeId = Number(id);
  const { targetAdminIds } = (await req.json()) as { targetAdminIds?: number[] };

  if (!Array.isArray(targetAdminIds)) {
    return NextResponse.json({ error: "targetAdminIds must be an array" }, { status: 400 });
  }

  const ids = targetAdminIds.filter((tid) => tid !== granteeId);

  await sql`DELETE FROM admin_access_grants WHERE grantee_admin_id = ${granteeId}`;
  for (const targetId of ids) {
    await sql`
      INSERT INTO admin_access_grants (grantee_admin_id, target_admin_id)
      VALUES (${granteeId}, ${targetId})
      ON CONFLICT DO NOTHING
    `;
  }

  return NextResponse.json({ ok: true });
}
