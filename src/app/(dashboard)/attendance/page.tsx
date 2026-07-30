import Link from "next/link";
import { getAttendanceLog } from "@/lib/queries";
import { sql } from "@/lib/db";
import { AttendanceTable } from "@/components/AttendanceTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const employeeId = params.employeeId ? Number(params.employeeId) : undefined;
  const type = params.type || undefined;

  const [{ records, total }, employees] = await Promise.all([
    getAttendanceLog({ employeeId, type, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    sql`SELECT id, name FROM employees ORDER BY name`,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (employeeId) next.set("employeeId", String(employeeId));
    if (type) next.set("type", type);
    if (page > 1) next.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    return `/attendance?${next.toString()}`;
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Attendance Log
      </h2>

      <form className="mb-6 flex flex-wrap gap-3" action="/attendance" method="get">
        <select
          name="employeeId"
          defaultValue={employeeId ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All employees</option>
          {(employees as { id: number; name: string }[]).map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All types</option>
          <option value="Clock In">Clock In</option>
          <option value="Clock Out">Clock Out</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Filter
        </button>
      </form>

      <AttendanceTable records={records} />

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Link
            href={buildHref({ page: page > 1 ? String(page - 1) : undefined })}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Previous
          </Link>
          <Link
            href={buildHref({ page: String(page + 1) })}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-slate-300 px-3 py-1.5 dark:border-slate-700 ${
              page >= totalPages
                ? "pointer-events-none opacity-40"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
