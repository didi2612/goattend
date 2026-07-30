import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoBadge } from "@/components/LogoBadge";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--accent)" }}
      />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center gap-3">
          <LogoBadge size={48} imageSize={30} rounded="rounded-2xl" className="shadow-lg shadow-black/20" />
          <div>
            <h1 className="text-center text-lg font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-7 shadow-xl shadow-black/5">
          {children}
        </div>
      </div>
    </div>
  );
}
