"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export type MenuItem = {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  danger?: boolean;
};

export function DropdownMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="More actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-foreground"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-surface-hover ${
                  item.danger ? "text-red-500" : "text-foreground"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
