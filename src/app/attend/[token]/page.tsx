import { sql } from "@/lib/db";
import { getNextAttendanceType } from "@/lib/students";
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

  const { type: nextType, staleClockInId } = await getNextAttendanceType(student.id);

  return (
    <PublicAttendanceForm
      token={token}
      studentName={student.name}
      nextType={nextType}
      hadMissedClockOut={staleClockInId != null}
    />
  );
}
