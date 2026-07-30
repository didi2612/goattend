import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getServerSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <Sidebar email={session.email} role={session.role} isSuperadmin={session.role === "superadmin"} />
      <main className="md:pl-64">
        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
