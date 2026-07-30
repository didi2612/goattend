"use client";

import { useEffect, useRef, useState } from "react";

export function LogoBadge({
  size,
  imageSize,
  rounded = "rounded-lg",
  className = "",
}: {
  size: number;
  imageSize: number;
  rounded?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // The browser starts loading <img> from the SSR'd HTML before React
    // hydrates, so a one-shot check at mount can run before the request
    // has even failed yet. Attach real listeners instead: they catch the
    // failure whenever it actually happens, and the immediate check still
    // covers the case where it already failed by the time we attach.
    const img = imgRef.current;
    if (!img) return;
    const check = () => {
      if (img.complete && img.naturalWidth === 0) setFailed(true);
    };
    check();
    img.addEventListener("error", check);
    img.addEventListener("load", check);
    return () => {
      img.removeEventListener("error", check);
      img.removeEventListener("load", check);
    };
  }, []);

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${rounded} ${className}`}
      style={{ background: "#0f172a", width: size, height: size }}
    >
      {failed ? (
        <span
          className="font-bold text-white"
          style={{ fontSize: Math.round(size * 0.42), lineHeight: 1 }}
        >
          G
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src="/azp-logo.png"
          alt="AZP"
          width={imageSize}
          height={imageSize}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
