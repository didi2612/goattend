"use client";

import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      aria-label="Refresh page"
      title="Refresh page"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-hover hover:text-foreground"
    >
      <RefreshCw size={16} />
    </button>
  );
}
