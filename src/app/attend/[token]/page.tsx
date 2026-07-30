import { sql } from "@/lib/db";
import { PublicAttendanceForm } from "@/components/PublicAttendanceForm";

export const dynamic = "force-dynamic";

type StudentRow = { id: number; name: string; active: boolean };

export default async function AttendPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [student] = (await sql`
    SELECT id, name, active FROM students WHERE attendance_token = ${token}
  `) as StudentRow[];

  if (!student || !student.active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <p className="text-center text-slate-600 dark:text-slate-300">
          This attendance link is invalid or no longer active. Please contact your supervisor.
        </p>
      </div>
    );
  }

  const [lastRecord] = (await sql`
    SELECT type FROM attendance_log WHERE student_id = ${student.id} ORDER BY timestamp DESC LIMIT 1
  `) as { type: "Clock In" | "Clock Out" }[];
  const nextType: "Clock In" | "Clock Out" = lastRecord?.type === "Clock In" ? "Clock Out" : "Clock In";

  return <PublicAttendanceForm token={token} studentName={student.name} nextType={nextType} />;
}
