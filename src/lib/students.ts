import { sql } from "@/lib/db";
import { getVisibleStudentIds } from "@/lib/access";
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

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "student";
}

/**
 * Turns a student's name into a URL-friendly, human-searchable attendance
 * link (e.g. "John Doe" -> "john-doe"), appending -2/-3/... on collision so
 * the slug stays globally unique across all students.
 */
export async function generateAttendanceSlug(name: string): Promise<string> {
  const base = slugify(name);

  const existing = (await sql`
    SELECT attendance_token FROM students WHERE attendance_token = ${base} OR attendance_token LIKE ${base + "-%"}
  `) as { attendance_token: string }[];

  if (existing.length === 0) return base;

  const taken = new Set(existing.map((r) => r.attendance_token));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
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
  const studentIds = await getVisibleStudentIds(session);

  if (studentIds === null) {
    return (await sql.query(`${STUDENT_SELECT} ORDER BY s.name`)) as Student[];
  }

  return (await sql.query(`${STUDENT_SELECT} WHERE s.id = ANY($1) ORDER BY s.name`, [
    studentIds,
  ])) as Student[];
}

export async function createStudent(name: string, ownerId: number): Promise<Student> {
  const token = await generateAttendanceSlug(name);
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
