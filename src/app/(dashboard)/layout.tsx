import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { getServerSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            AZP Attendance Admin
          </h1>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-slate-600 hover:text-blue-600 dark:text-slate-300">
              Overview
            </Link>
            <Link
              href="/attendance"
              className="text-slate-600 hover:text-blue-600 dark:text-slate-300"
            >
              Attendance Log
            </Link>
            <Link
              href="/employees"
              className="text-slate-600 hover:text-blue-600 dark:text-slate-300"
            >
              Employees
            </Link>
            {session?.role === "superadmin" && (
              <Link
                href="/users"
                className="text-slate-600 hover:text-blue-600 dark:text-slate-300"
              >
                Users
              </Link>
            )}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
