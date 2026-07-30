import { randomBytes } from "crypto";
import { sql } from "@/lib/db";
import { getVisibleOwnerIds } from "@/lib/access";
import type { SessionPayload } from "@/lib/session";

export type Student = {
  id: number;
  name: string;
  owner_id: number;
  owner_name: string;
  attendance_token: string;
  active: boolean;
  created_at: string;
  last_type: "Clock In" | "Clock Out" | null;
};

export function generateAttendanceToken(): string {
  return randomBytes(16).toString("base64url");
}

const STUDENT_SELECT = `
  SELECT s.id, s.name, s.owner_id, COALESCE(u.name, u.email) AS owner_name,
         s.attendance_token, s.active, s.created_at,
         last_event.type AS last_type
  FROM students s
  JOIN users u ON u.id = s.owner_id
  LEFT JOIN LATERAL (
    SELECT type FROM attendance_log a
    WHERE a.student_id = s.id
    ORDER BY a.timestamp DESC
    LIMIT 1
  ) last_event ON true
`;

export async function listVisibleStudents(session: SessionPayload): Promise<Student[]> {
  const ownerIds = await getVisibleOwnerIds(session);

  if (ownerIds === null) {
    return (await sql.query(`${STUDENT_SELECT} ORDER BY s.name`)) as Student[];
  }

  return (await sql.query(`${STUDENT_SELECT} WHERE s.owner_id = ANY($1) ORDER BY s.name`, [
    ownerIds,
  ])) as Student[];
}

export async function createStudent(name: string, ownerId: number): Promise<Student> {
  const token = generateAttendanceToken();
  const [student] = (await sql`
    INSERT INTO students (name, owner_id, attendance_token)
    VALUES (${name}, ${ownerId}, ${token})
    RETURNING id, name, owner_id, attendance_token, active, created_at
  `) as Omit<Student, "owner_name" | "last_type">[];

  const [owner] = (await sql`SELECT name, email FROM users WHERE id = ${ownerId}`) as {
    name: string | null;
    email: string;
  }[];

  return { ...student, owner_name: owner.name ?? owner.email, last_type: null };
}
