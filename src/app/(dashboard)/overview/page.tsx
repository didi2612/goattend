import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, CalendarCheck, ArrowRight, LogIn, LogOut as LogOutIcon, Radio, Clock } from "lucide-react";
import { getOverviewStats, getDailyHoursTrend, getTopStudentsByHours } from "@/lib/queries";
import { listVisibleStudents } from "@/lib/students";
import { getServerSession } from "@/lib/session";
import { AttendanceTrendChart } from "@/components/AttendanceTrendChart";
import { StudentLinksList } from "@/components/StudentLinksList";
import { TopStudentsByHours } from "@/components/TopStudentsByHours";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const STUDENT_LINKS_PREVIEW_COUNT = 8;
const TREND_DAYS = 14;

export default async function OverviewPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const [{ totalStudents, todayCount, clockedInNow, recent }, trend, topByHours, students] =
    await Promise.all([
      getOverviewStats(session),
      getDailyHoursTrend(session, TREND_DAYS),
      getTopStudentsByHours(session, TREND_DAYS),
      listVisibleStudents(session),
    ]);

  const daysWithData = trend.filter((d) => d.studentsCount > 0);
  const periodAvgHours =
    daysWithData.length > 0
      ? daysWithData.reduce((sum, d) => sum + d.avgHours, 0) / daysWithData.length
      : 0;

  const scopeLabel = session.role === "admin" ? "Your Students" : "All Students";

  return (
    <div>
      <PageHeader title="Overview" description={`Attendance snapshot for ${scopeLabel.toLowerCase()}`} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--chart-blue-soft)", color: "var(--chart-blue)" }}
          >
            <Radio size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Clocked In Now</p>
            <p className="mt-0.5 text-2xl font-bold text-foreground">{clockedInNow}</p>
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
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--chart-orange-soft)", color: "var(--chart-orange)" }}
          >
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Avg Hours/Day ({TREND_DAYS}d)</p>
            <p className="mt-0.5 text-2xl font-bold text-foreground">
              {periodAvgHours > 0 ? `${periodAvgHours.toFixed(1)}h` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              Avg Hours Worked Per Day, Last {TREND_DAYS} Days
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
                      background:
                        r.type === "Clock In" ? "var(--chart-blue-soft)" : "var(--chart-orange-soft)",
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

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-3 flex items-center justify-between">
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
              Give each student their own link to submit attendance from. No login needed on their
              end.
            </p>
            <StudentLinksList
              students={students.filter((s) => s.active).slice(0, STUDENT_LINKS_PREVIEW_COUNT)}
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Top Students by Hours ({TREND_DAYS}d)
            </h2>
            <TopStudentsByHours students={topByHours} />
          </div>
        </div>
      </div>
    </div>
  );
}
