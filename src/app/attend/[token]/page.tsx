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
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-foreground">
            This attendance link is invalid or no longer active. Please contact your supervisor.
          </p>
        </div>
      </div>
    );
  }

  const [lastRecord] = (await sql`
    SELECT type FROM attendance_log WHERE student_id = ${student.id} ORDER BY timestamp DESC LIMIT 1
  `) as { type: "Clock In" | "Clock Out" }[];
  const nextType: "Clock In" | "Clock Out" = lastRecord?.type === "Clock In" ? "Clock Out" : "Clock In";

  return <PublicAttendanceForm token={token} studentName={student.name} nextType={nextType} />;
}
