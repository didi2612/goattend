import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendInviteEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user] = (await sql`
    SELECT id, email, name FROM users WHERE id = ${Number(id)}
  `) as { id: number; email: string; name: string | null }[];

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = await createAuthToken(user.id, "invite");

  try {
    await sendInviteEmail({ email: user.email, name: user.name, token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
