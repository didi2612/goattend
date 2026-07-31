"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported] = useState(
    () => typeof document !== "undefined" && typeof document.documentElement.requestFullscreen === "function",
  );

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!supported) return null;

  async function toggle() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
      title={isFullscreen ? "Exit full screen" : "Enter full screen"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-hover hover:text-foreground"
    >
      {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
    </button>
  );
}
