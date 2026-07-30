import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAttendanceLog } from "@/lib/queries";
import { listVisibleStudents } from "@/lib/students";
import { getServerSession } from "@/lib/session";
import { AttendanceTable } from "@/components/AttendanceTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; type?: string; page?: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const studentId = params.studentId ? Number(params.studentId) : undefined;
  const type = params.type || undefined;

  const [{ records, total }, students] = await Promise.all([
    getAttendanceLog(session, { studentId, type, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    listVisibleStudents(session),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (studentId) next.set("studentId", String(studentId));
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
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Attendance Log</h1>

      <form className="mb-6 flex flex-wrap gap-3" action="/attendance" method="get">
        <select
          name="studentId"
          defaultValue={studentId ?? ""}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All types</option>
          <option value="Clock In">Clock In</option>
          <option value="Clock Out">Clock Out</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
        >
          Filter
        </button>
      </form>

      <AttendanceTable records={records} />

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Link
            href={buildHref({ page: page > 1 ? String(page - 1) : undefined })}
            aria-disabled={page <= 1}
            className={`flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-surface-hover"
            }`}
          >
            <ChevronLeft size={15} />
            Previous
          </Link>
          <Link
            href={buildHref({ page: String(page + 1) })}
            aria-disabled={page >= totalPages}
            className={`flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 ${
              page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-surface-hover"
            }`}
          >
            Next
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
