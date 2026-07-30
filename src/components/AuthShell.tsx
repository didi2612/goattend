import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground">
            A
          </div>
          <h1 className="text-center text-lg font-bold tracking-tight text-foreground">{title}</h1>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
