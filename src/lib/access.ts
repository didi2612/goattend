import { sql } from "@/lib/db";
import type { SessionPayload } from "@/lib/session";

/**
 * Returns null if the session can see every student (superadmin), otherwise
 * the set of student ids visible to them: students they own, plus any
 * individual students a superadmin has explicitly granted them access to.
 */
export async function getVisibleStudentIds(session: SessionPayload): Promise<number[] | null> {
  if (session.role === "superadmin") return null;

  const rows = (await sql`
    SELECT id FROM students WHERE owner_id = ${session.userId}
    UNION
    SELECT student_id AS id FROM student_access_grants WHERE grantee_admin_id = ${session.userId}
  `) as { id: number }[];

  return rows.map((r) => r.id);
}

export function canManageStudent(session: SessionPayload, ownerId: number): boolean {
  return session.role === "superadmin" || ownerId === session.userId;
}
