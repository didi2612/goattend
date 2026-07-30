"use client";

import { useRef, useState } from "react";
import type { DailyHoursPoint } from "@/lib/queries";

const LINE_COLOR = "var(--chart-blue)";

const WIDTH = 720;
const HEIGHT = 220;
const PADDING_LEFT = 32;
const PADDING_BOTTOM = 24;
const PADDING_TOP = 12;
const PADDING_RIGHT = 8;

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

export function AttendanceTrendChart({ data }: { data: DailyHoursPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxValue = Math.max(1, ...data.map((d) => d.avgHours));
  const niceMax = Math.ceil(maxValue / 2) * 2 || 2;

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function xFor(i: number) {
    return data.length <= 1
      ? PADDING_LEFT + plotWidth / 2
      : PADDING_LEFT + (i / (data.length - 1)) * plotWidth;
  }
  function yFor(value: number) {
    return PADDING_TOP + plotHeight - (value / niceMax) * plotHeight;
  }

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.avgHours) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${yFor(0)} L${points[0].x},${yFor(0)} Z`
      : "";

  const ticks = [0, niceMax / 2, niceMax];

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PADDING_LEFT}
              x2={WIDTH - PADDING_RIGHT}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={0} y={yFor(t) + 4} fontSize={10} fill="var(--muted)">
              {t}h
            </text>
          </g>
        ))}

        <line
          x1={PADDING_LEFT}
          x2={WIDTH - PADDING_RIGHT}
          y1={yFor(0)}
          y2={yFor(0)}
          stroke="var(--muted)"
          strokeWidth={1}
        />

        {areaPath && <path d={areaPath} fill={LINE_COLOR} opacity={0.1} />}
        {linePath && <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

        {hoverIdx !== null && (
          <line
            x1={points[hoverIdx].x}
            x2={points[hoverIdx].x}
            y1={PADDING_TOP}
            y2={yFor(0)}
            stroke="var(--muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {points.map((p, i) => {
          const isHover = i === hoverIdx;
          const showLabel = i === 0 || i === data.length - 1 || isHover;
          return (
            <g key={data[i].date}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHover ? 5 : 4}
                fill={LINE_COLOR}
                stroke="var(--surface)"
                strokeWidth={2}
              />
              {showLabel && (
                <text x={p.x} y={HEIGHT - 6} fontSize={10} textAnchor="middle" fill="var(--muted)">
                  {formatDayLabel(data[i].date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoverIdx !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${(points[hoverIdx].x / WIDTH) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="mb-1 font-semibold text-foreground">{formatDayLabel(data[hoverIdx].date)}</p>
          <p className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: LINE_COLOR }} />
            Avg {formatHours(data[hoverIdx].avgHours)} · {data[hoverIdx].studentsCount} student
            {data[hoverIdx].studentsCount === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
