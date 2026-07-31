"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { RefreshButton } from "@/components/RefreshButton";
import { LogoBadge } from "@/components/LogoBadge";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

const NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance Log", icon: ClipboardList },
  { href: "/students", label: "Students", icon: Users },
];

const SUPERADMIN_ITEM: NavItem = { href: "/users", label: "Users", icon: ShieldCheck };

export function Sidebar({
  username,
  role,
  isSuperadmin,
}: {
  username: string;
  role: string;
  isSuperadmin: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = isSuperadmin ? [...NAV_ITEMS, SUPERADMIN_ITEM] : NAV_ITEMS;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-6">
        <LogoBadge size={32} imageSize={20} />
        <span className="text-sm font-bold tracking-tight text-foreground">AZP : GO ATTEND</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-border p-4">
        <div className="flex items-center justify-between rounded-lg px-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{username}</p>
            <p className="text-xs capitalize text-muted">{role}</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton />
            <FullscreenToggle />
            <ThemeToggle />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-foreground"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <LogoBadge size={28} imageSize={17} />
          <span className="text-sm font-bold text-foreground">AZP : GO ATTEND</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface md:flex">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"
            >
              <X size={18} />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
