import { sql } from "@/lib/db";

export type AttendanceRecord = {
  id: number;
  employee_id: number;
  employee_name: string;
  type: "Clock In" | "Clock Out";
  image_url: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export async function getAttendanceLog(params: {
  employeeId?: number;
  type?: string;
  limit: number;
  offset: number;
}): Promise<{ records: AttendanceRecord[]; total: number }> {
  const { employeeId, type, limit, offset } = params;

  const values: unknown[] = [];
  const conditions: string[] = [];
  if (employeeId) {
    values.push(employeeId);
    conditions.push(`a.employee_id = $${values.length}`);
  }
  if (type) {
    values.push(type);
    conditions.push(`a.type = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  values.push(limit);
  const limitIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const records = await sql.query(
    `SELECT a.id, a.employee_id, e.name AS employee_name, a.type, a.image_url,
            a.latitude, a.longitude, a.timestamp
     FROM attendance_log a
     JOIN employees e ON e.id = a.employee_id
     ${where}
     ORDER BY a.timestamp DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values,
  );

  const countValues = values.slice(0, conditions.length);
  const countResult = await sql.query(
    `SELECT COUNT(*)::int AS count FROM attendance_log a ${where}`,
    countValues,
  );

  return {
    records: records as unknown as AttendanceRecord[],
    total: (countResult as unknown as { count: number }[])[0].count,
  };
}

export async function getOverviewStats() {
  const [{ count: totalEmployees }] = await sql`
    SELECT COUNT(*)::int AS count FROM employees WHERE active = TRUE
  `;

  const [{ count: todayCount }] = await sql`
    SELECT COUNT(*)::int AS count FROM attendance_log
    WHERE timestamp >= date_trunc('day', now() AT TIME ZONE 'Asia/Kuala_Lumpur') AT TIME ZONE 'Asia/Kuala_Lumpur'
  `;

  const recent = await sql`
    SELECT a.id, a.employee_id, e.name AS employee_name, a.type, a.image_url,
           a.latitude, a.longitude, a.timestamp
    FROM attendance_log a
    JOIN employees e ON e.id = a.employee_id
    ORDER BY a.timestamp DESC
    LIMIT 5
  `;

  return {
    totalEmployees: totalEmployees as number,
    todayCount: todayCount as number,
    recent: recent as unknown as AttendanceRecord[],
  };
}
