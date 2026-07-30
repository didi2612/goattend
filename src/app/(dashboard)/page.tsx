import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, CalendarCheck, ArrowRight, LogIn, LogOut as LogOutIcon } from "lucide-react";
import { getOverviewStats, getDailyAttendanceTrend } from "@/lib/queries";
import { listVisibleStudents } from "@/lib/students";
import { getServerSession } from "@/lib/session";
import { AttendanceTrendChart } from "@/components/AttendanceTrendChart";
import { StudentLinksList } from "@/components/StudentLinksList";

export const dynamic = "force-dynamic";

const STUDENT_LINKS_PREVIEW_COUNT = 6;

export default async function OverviewPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const [{ totalStudents, todayCount, recent }, trend, students] = await Promise.all([
    getOverviewStats(session),
    getDailyAttendanceTrend(session),
    listVisibleStudents(session),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Overview</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Users size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Active Students</p>
            <p className="mt-0.5 text-2xl font-bold text-foreground">{totalStudents}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Clock Events Today</p>
            <p className="mt-0.5 text-2xl font-bold text-foreground">{todayCount}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Share Attendance Links</h2>
          <Link
            href="/students"
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
        <p className="mb-3 text-sm text-muted">
          Give each student their own link to submit attendance from &mdash; no login needed on
          their end.
        </p>
        <StudentLinksList students={students.slice(0, STUDENT_LINKS_PREVIEW_COUNT)} />
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Attendance, Last 14 Days{session.role === "admin" ? " (Your Students)" : " (All Students)"}
        </h2>
        <AttendanceTrendChart data={trend} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
          <Link
            href="/attendance"
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3 text-sm">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: r.type === "Clock In" ? "var(--chart-blue-soft)" : "var(--chart-orange-soft)",
                  color: r.type === "Clock In" ? "var(--chart-blue)" : "var(--chart-orange)",
                }}
              >
                {r.type === "Clock In" ? <LogIn size={15} /> : <LogOutIcon size={15} />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.student_name}</p>
                <p className="text-muted">
                  {r.type} · {new Date(r.timestamp).toLocaleString("en-MY")}
                </p>
              </div>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="py-6 text-center text-sm text-muted">No attendance records yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
