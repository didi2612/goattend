import { sql } from "@/lib/db";
import { getVisibleOwnerIds } from "@/lib/access";
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
  const ownerIds = await getVisibleOwnerIds(session);

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
  if (ownerIds !== null) {
    values.push(ownerIds);
    conditions.push(`s.owner_id = ANY($${values.length})`);
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
  const ownerIds = await getVisibleOwnerIds(session);
  const ownerFilter = ownerIds !== null ? { owner_id: ownerIds } : null;

  const totalStudentsResult =
    ownerFilter === null
      ? await sql`SELECT COUNT(*)::int AS count FROM students WHERE active = TRUE`
      : await sql.query(
          `SELECT COUNT(*)::int AS count FROM students WHERE active = TRUE AND owner_id = ANY($1)`,
          [ownerFilter.owner_id],
        );
  const totalStudents = (totalStudentsResult as { count: number }[])[0].count;

  const todayCountResult =
    ownerFilter === null
      ? await sql`
          SELECT COUNT(*)::int AS count FROM attendance_log
          WHERE timestamp >= date_trunc('day', now() AT TIME ZONE 'Asia/Kuala_Lumpur') AT TIME ZONE 'Asia/Kuala_Lumpur'
        `
      : await sql.query(
          `SELECT COUNT(*)::int AS count
           FROM attendance_log a
           JOIN students s ON s.id = a.student_id
           WHERE a.timestamp >= date_trunc('day', now() AT TIME ZONE 'Asia/Kuala_Lumpur') AT TIME ZONE 'Asia/Kuala_Lumpur'
             AND s.owner_id = ANY($1)`,
          [ownerFilter.owner_id],
        );
  const todayCount = (todayCountResult as { count: number }[])[0].count;

  const clockedInResult =
    ownerFilter === null
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
             WHERE s.active = TRUE AND s.owner_id = ANY($1)
             ORDER BY a.student_id, a.timestamp DESC
           ) last_event
           WHERE last_event.type = 'Clock In'`,
          [ownerFilter.owner_id],
        );
  const clockedInNow = (clockedInResult as { count: number }[])[0].count;

  const recentResult =
    ownerFilter === null
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
           WHERE s.owner_id = ANY($1)
           ORDER BY a.timestamp DESC
           LIMIT 5`,
          [ownerFilter.owner_id],
        );

  return {
    totalStudents,
    todayCount,
    clockedInNow,
    recent: recentResult as unknown as AttendanceRecord[],
  };
}

export type DailyTrendPoint = { date: string; clockIn: number; clockOut: number };

export async function getDailyAttendanceTrend(
  session: SessionPayload,
  days = 14,
): Promise<DailyTrendPoint[]> {
  const ownerIds = await getVisibleOwnerIds(session);

  // generate_series builds the full day range (including zero-count days) in
  // Malaysia local time, then left-joins actual counts onto it, so the series
  // and the grouping use the same calendar-day boundary.
  const baseQuery = `
    WITH days AS (
      SELECT generate_series(
        (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date - ($1::int - 1),
        (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date,
        '1 day'
      )::date AS day
    ),
    events AS (
      SELECT (a.timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')::date AS day, a.type
      FROM attendance_log a
      JOIN students s ON s.id = a.student_id
      WHERE a.timestamp >= (now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date - ($1::int - 1)
        ${ownerIds !== null ? "AND s.owner_id = ANY($2)" : ""}
    )
    SELECT
      to_char(days.day, 'YYYY-MM-DD') AS day,
      COUNT(*) FILTER (WHERE events.type = 'Clock In')::int AS clock_in,
      COUNT(*) FILTER (WHERE events.type = 'Clock Out')::int AS clock_out
    FROM days
    LEFT JOIN events ON events.day = days.day
    GROUP BY days.day
    ORDER BY days.day
  `;

  const values: unknown[] = ownerIds !== null ? [days, ownerIds] : [days];
  const rows = (await sql.query(baseQuery, values)) as {
    day: string;
    clock_in: number;
    clock_out: number;
  }[];

  return rows.map((r) => ({ date: r.day, clockIn: r.clock_in, clockOut: r.clock_out }));
}
