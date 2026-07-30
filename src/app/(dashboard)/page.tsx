import Link from "next/link";
import { getOverviewStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { totalEmployees, todayCount, recent } = await getOverviewStats();

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Employees</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {totalEmployees}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Clock Events Today</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{todayCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Recent Activity
          </h2>
          <Link href="/attendance" className="text-sm font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{r.employee_name}</p>
                <p className="text-slate-500 dark:text-slate-400">
                  {r.type} · {new Date(r.timestamp).toLocaleString("en-MY")}
                </p>
              </div>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No attendance records yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
