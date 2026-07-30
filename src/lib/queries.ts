import { sql } from "@/lib/db";
import { getVisibleStudentIds } from "@/lib/access";
import type { SessionPayload } from "@/lib/session";

export type AttendanceRecord = {
  id: number;
  student_id: number;
  student_name: string;
  type: "Clock In" | "Clock Out";
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  source: "self" | "manual";
  remarks: string | null;
  student_owner_id: number;
};

export async function getAttendanceLog(
  session: SessionPayload,
  params: {
    studentId?: number;
    type?: string;
    limit: number;
    offset: number;
  },
): Promise<{ records: AttendanceRecord[]; total: number }> {
  const { studentId, type, limit, offset } = params;
  const studentIds = await getVisibleStudentIds(session);

  const values: unknown[] = [];
  const conditions: string[] = [];
  if (studentId) {
    values.push(studentId);
    conditions.push(`a.student_id = $${values.length}`);
  }
  if (type) {
    values.push(type);
    conditions.push(`a.type = $${values.length}`);
  }
  if (studentIds !== null) {
    values.push(studentIds);
    conditions.push(`s.id = ANY($${values.length})`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  values.push(limit);
  const limitIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const records = await sql.query(
    `SELECT a.id, a.student_id, s.name AS student_name, a.type, a.image_url,
            a.latitude, a.longitude, a.timestamp, a.source, a.remarks,
            s.owner_id AS student_owner_id
     FROM attendance_log a
     JOIN students s ON s.id = a.student_id
     ${where}
     ORDER BY a.timestamp DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values,
  );

  const countValues = values.slice(0, conditions.length);
  const countResult = await sql.query(
    `SELECT COUNT(*)::int AS count
     FROM attendance_log a
     JOIN students s ON s.id = a.student_id
     ${where}`,
    countValues,
  );

  return {
    records: records as unknown as AttendanceRecord[],
    total: (countResult as unknown as { count: number }[])[0].count,
  };
}

export async function getOverviewStats(session: SessionPayload) {
  const studentIds = await getVisibleStudentIds(session);
  const filter = studentIds !== null ? { student_id: studentIds } : null;

  const totalStudentsResult =
    filter === null
      ? await sql`SELECT COUNT(*)::int AS count FROM students WHERE active = TRUE`
      : await sql.query(
          `SELECT COUNT(*)::int AS count FROM students WHERE active = TRUE AND id = ANY($1)`,
          [filter.student_id],
        );
  const totalStudents = (totalStudentsResult as { count: number }[])[0].count;

  const todayCountResult =
    filter === null
      ? await sql`
          SELECT COUNT(*)::int AS count FROM attendance_log
          WHERE timestamp >= date_trunc('day', now() AT TIME ZONE 'Asia/Kuala_Lumpur') AT TIME ZONE 'Asia/Kuala_Lumpur'
        `
      : await sql.query(
          `SELECT COUNT(*)::int AS count
           FROM attendance_log a
           WHERE a.timestamp >= date_trunc('day', now() AT TIME ZONE 'Asia/Kuala_Lumpur') AT TIME ZONE 'Asia/Kuala_Lumpur'
             AND a.student_id = ANY($1)`,
          [filter.student_id],
        );
  const todayCount = (todayCountResult as { count: number }[])[0].count;

  const clockedInResult =
    filter === null
      ? await sql`
          SELECT COUNT(*)::int AS count FROM (
            SELECT DISTINCT ON (a.student_id) a.student_id, a.type
            FROM attendance_log a
            JOIN students s ON s.id = a.student_id
            WHERE s.active = TRUE
            ORDER BY a.student_id, a.timestamp DESC
          ) last_event
          WHERE last_event.type = 'Clock In'
        `
      : await sql.query(
          `SELECT COUNT(*)::int AS count FROM (
             SELECT DISTINCT ON (a.student_id) a.student_id, a.type
             FROM attendance_log a
             JOIN students s ON s.id = a.student_id
             WHERE s.active = TRUE AND s.id = ANY($1)
             ORDER BY a.student_id, a.timestamp DESC
           ) last_event
           WHERE last_event.type = 'Clock In'`,
          [filter.student_id],
        );
  const clockedInNow = (clockedInResult as { count: number }[])[0].count;

  const recentResult =
    filter === null
      ? await sql`
          SELECT a.id, a.student_id, s.name AS student_name, a.type, a.image_url,
                 a.latitude, a.longitude, a.timestamp, a.source
          FROM attendance_log a
          JOIN students s ON s.id = a.student_id
          ORDER BY a.timestamp DESC
          LIMIT 5
        `
      : await sql.query(
          `SELECT a.id, a.student_id, s.name AS student_name, a.type, a.image_url,
                  a.latitude, a.longitude, a.timestamp, a.source
           FROM attendance_log a
           JOIN students s ON s.id = a.student_id
           WHERE s.id = ANY($1)
           ORDER BY a.timestamp DESC
           LIMIT 5`,
          [filter.student_id],
        );

  return {
    totalStudents,
    todayCount,
    clockedInNow,
    recent: recentResult as unknown as AttendanceRecord[],
  };
}

export type DailyHoursPoint = { date: string; avgHours: number; studentsCount: number };

/**
 * Per student per day, "hours worked" is the span between their earliest
 * Clock In and latest Clock Out that day. This is a simple approximation
 * (it doesn't try to pair up multiple in/out cycles in one day) but matches
 * how a normal single-shift day is actually recorded here.
 */
const HOURS_CTE = (studentIds: number[] | null) => `
  WITH events AS (
    SELECT a.student_id, (a.timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')::date AS day,
           a.type, a.timestamp
    FROM attendance_log a
    WHERE a.timestamp >= (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date - ($1::int - 1)
      ${studentIds !== null ? "AND a.student_id = ANY($2)" : ""}
  ),
  daily AS (
    SELECT student_id, day,
      MIN(timestamp) FILTER (WHERE type = 'Clock In') AS first_in,
      MAX(timestamp) FILTER (WHERE type = 'Clock Out') AS last_out
    FROM events
    GROUP BY student_id, day
  ),
  durations AS (
    SELECT student_id, day, EXTRACT(EPOCH FROM (last_out - first_in)) / 3600.0 AS hours
    FROM daily
    WHERE first_in IS NOT NULL AND last_out IS NOT NULL AND last_out > first_in
  )
`;

export async function getDailyHoursTrend(
  session: SessionPayload,
  days = 14,
): Promise<DailyHoursPoint[]> {
  const studentIds = await getVisibleStudentIds(session);

  // generate_series builds the full day range (including zero-record days) in
  // Malaysia local time, then left-joins computed durations onto it, so the
  // series and the grouping use the same calendar-day boundary.
  const query = `
    ${HOURS_CTE(studentIds)},
    days AS (
      SELECT generate_series(
        (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date - ($1::int - 1),
        (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date,
        '1 day'
      )::date AS day
    )
    SELECT
      to_char(days.day, 'YYYY-MM-DD') AS day,
      COALESCE(AVG(durations.hours), 0) AS avg_hours,
      COUNT(durations.hours)::int AS students_count
    FROM days
    LEFT JOIN durations ON durations.day = days.day
    GROUP BY days.day
    ORDER BY days.day
  `;

  const values: unknown[] = studentIds !== null ? [days, studentIds] : [days];
  const rows = (await sql.query(query, values)) as {
    day: string;
    avg_hours: string;
    students_count: number;
  }[];

  return rows.map((r) => ({
    date: r.day,
    avgHours: Number(r.avg_hours),
    studentsCount: r.students_count,
  }));
}

export type StudentHoursSummary = {
  studentId: number;
  studentName: string;
  totalHours: number;
  daysWorked: number;
};

export async function getTopStudentsByHours(
  session: SessionPayload,
  days = 14,
  limit = 5,
): Promise<StudentHoursSummary[]> {
  const studentIds = await getVisibleStudentIds(session);

  const values: unknown[] = studentIds !== null ? [days, studentIds] : [days];
  const limitIdx = values.length + 1;
  values.push(limit);

  const query = `
    ${HOURS_CTE(studentIds)}
    SELECT s.id, s.name, SUM(durations.hours) AS total_hours, COUNT(*)::int AS days_worked
    FROM durations
    JOIN students s ON s.id = durations.student_id
    WHERE s.active = TRUE
    GROUP BY s.id, s.name
    ORDER BY total_hours DESC
    LIMIT $${limitIdx}
  `;

  const rows = (await sql.query(query, values)) as {
    id: number;
    name: string;
    total_hours: string;
    days_worked: number;
  }[];

  return rows.map((r) => ({
    studentId: r.id,
    studentName: r.name,
    totalHours: Number(r.total_hours),
    daysWorked: r.days_worked,
  }));
}
