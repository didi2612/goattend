"use client";

import { useEffect, useState } from "react";
import { LogoBadge } from "@/components/LogoBadge";

const MIN_VISIBLE_MS = 700;
const FADE_MS = 300;

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), MIN_VISIBLE_MS);
    const hideTimer = setTimeout(() => setVisible(false), MIN_VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-4 bg-background transition-opacity"
      style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
      aria-hidden="true"
    >
      <LogoBadge
        size={64}
        imageSize={40}
        rounded="rounded-2xl"
        className="shadow-lg shadow-black/20 animate-pulse"
      />
      <span className="text-sm font-bold tracking-tight text-foreground">AZP : GO ATTEND</span>
    </div>
  );
}
