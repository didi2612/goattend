import type { StudentHoursSummary } from "@/lib/queries";

function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

export function TopStudentsByHours({ students }: { students: StudentHoursSummary[] }) {
  if (students.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No completed shifts yet.</p>;
  }

  const maxHours = Math.max(...students.map((s) => s.totalHours));

  return (
    <ul className="space-y-3">
      {students.map((s, i) => (
        <li key={s.studentId}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {i + 1}. {s.studentName}
            </span>
            <span className="text-muted">
              {formatHours(s.totalHours)} · {s.daysWorked}d
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full"
              style={{
                width: `${maxHours > 0 ? (s.totalHours / maxHours) * 100 : 0}%`,
                background: "var(--chart-blue)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
