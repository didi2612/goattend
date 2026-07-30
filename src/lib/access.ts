import { sql } from "@/lib/db";
import type { SessionPayload } from "@/lib/session";

/**
 * Returns null if the session can see every student (superadmin), otherwise
 * the set of admin user ids whose students are visible: themselves, plus
 * anyone a superadmin has explicitly granted them access to.
 */
export async function getVisibleOwnerIds(session: SessionPayload): Promise<number[] | null> {
  if (session.role === "superadmin") return null;

  const grants = (await sql`
    SELECT target_admin_id FROM admin_access_grants WHERE grantee_admin_id = ${session.userId}
  `) as { target_admin_id: number }[];

  const ownerIds = new Set<number>([session.userId, ...grants.map((g) => g.target_admin_id)]);
  return [...ownerIds];
}

export function canManageStudent(session: SessionPayload, ownerId: number): boolean {
  return session.role === "superadmin" || ownerId === session.userId;
}
