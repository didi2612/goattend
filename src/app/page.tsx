import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Camera,
  MapPin,
  BarChart3,
  Link2,
  ShieldCheck,
  Bell,
  ArrowRight,
  LogIn as LogInIcon,
  LogOut as LogOutIcon,
  CheckCircle2,
} from "lucide-react";
import { getServerSession } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { RefreshButton } from "@/components/RefreshButton";
import { LogoBadge } from "@/components/LogoBadge";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Camera,
    title: "Selfie-verified clock-ins",
    description:
      "Every clock in and out is paired with a live selfie, so attendance can't be faked or submitted on someone else's behalf.",
  },
  {
    icon: MapPin,
    title: "Location-checked",
    description:
      "GPS coordinates are captured on every entry, giving supervisors real evidence of where attendance was recorded.",
  },
  {
    icon: Link2,
    title: "No app, no login for students",
    description:
      "Each student gets a personal link. They open it, snap a photo, and confirm — no account or install required.",
  },
  {
    icon: BarChart3,
    title: "Live dashboard & trends",
    description:
      "Track who's clocked in right now, daily hours, and attendance trends across your whole roster at a glance.",
  },
  {
    icon: Bell,
    title: "Automatic flagging",
    description:
      "Missed clock-outs are detected and flagged automatically, so nothing slips through unnoticed.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Admins manage their own students; superadmins see and manage everything. Access scoped exactly how you need it.",
  },
];

const STEPS = [
  {
    icon: Link2,
    title: "Share their link",
    description: "Generate a personal attendance link for each student and send it once.",
  },
  {
    icon: Camera,
    title: "They snap & confirm",
    description: "Students open the link, take a selfie, and confirm Clock In or Clock Out.",
  },
  {
    icon: BarChart3,
    title: "You see it live",
    description: "Every event lands on your dashboard instantly, with photo and location attached.",
  },
];

export default async function LandingPage() {
  const session = await getServerSession();
  if (session) redirect("/overview");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--accent)" }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-2.5">
          <LogoBadge size={36} imageSize={22} rounded="rounded-xl" />
          <span className="text-sm font-bold tracking-tight text-foreground">AZP : GO ATTEND</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <RefreshButton />
          <FullscreenToggle />
          <ThemeToggle />
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Sign In
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* Hero */}
        <section className="flex flex-col items-center py-16 text-center sm:py-24">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live attendance tracking
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Attendance you can{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, var(--accent), var(--chart-blue))" }}
            >
              actually trust
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Selfie- and location-verified clock in/out for students and interns, with a live
            dashboard that shows every event as it happens — no spreadsheets, no guesswork.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Sign In to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Mini clock in/out preview */}
          <div className="mt-14 flex items-center gap-3 rounded-2xl border border-border bg-surface p-2 shadow-xl shadow-black/5">
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{ background: "var(--chart-blue-soft)", color: "var(--chart-blue)" }}
            >
              <LogInIcon size={16} />
              <span className="text-sm font-semibold">Clock In · 08:59 AM</span>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{ background: "var(--chart-orange-soft)", color: "var(--chart-orange)" }}
            >
              <LogOutIcon size={16} />
              <span className="text-sm font-semibold">Clock Out · 04:02 PM</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-14 sm:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Built for supervisors managing students and interns day to day.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/40"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <f.icon size={20} />
                </div>
                <h3 className="mb-1.5 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-14 sm:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">Three steps, no onboarding needed.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-border bg-surface p-6">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <s.icon size={18} />
                </div>
                <h3 className="mb-1.5 font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:px-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--chart-blue))" }}
            />
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Ready to see who&apos;s actually clocked in?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted sm:text-base">
                Sign in to manage students, share attendance links, and watch activity roll in live.
              </p>
              <Link
                href="/login"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
              >
                Sign In to Dashboard
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <LogoBadge size={24} imageSize={15} />
            <span className="font-medium text-foreground">AZP : GO ATTEND</span>
          </div>
          <p>&copy; {new Date().getFullYear()} AZP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
