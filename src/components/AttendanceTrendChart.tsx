"use client";

import { useState } from "react";
import type { DailyTrendPoint } from "@/lib/queries";

const CLOCK_IN_COLOR = "var(--chart-blue)";
const CLOCK_OUT_COLOR = "var(--chart-orange)";

const WIDTH = 720;
const HEIGHT = 220;
const PADDING_LEFT = 32;
const PADDING_BOTTOM = 24;
const PADDING_TOP = 12;

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

export function AttendanceTrendChart({ data }: { data: DailyTrendPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.clockIn, d.clockOut)));
  const niceMax = Math.ceil(maxValue / 5) * 5 || 5;

  const plotWidth = WIDTH - PADDING_LEFT - 8;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(16, groupWidth / 2 - 3);

  function yFor(value: number) {
    return PADDING_TOP + plotHeight - (value / niceMax) * plotHeight;
  }

  const ticks = [0, niceMax / 2, niceMax];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
        {/* gridlines + y ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PADDING_LEFT}
              x2={WIDTH}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={0} y={yFor(t) + 4} fontSize={10} fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}

        {/* baseline */}
        <line
          x1={PADDING_LEFT}
          x2={WIDTH}
          y1={yFor(0)}
          y2={yFor(0)}
          stroke="var(--muted)"
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const groupX = PADDING_LEFT + i * groupWidth + (groupWidth - barWidth * 2 - 2) / 2;
          const inH = plotHeight - (yFor(d.clockIn) - PADDING_TOP);
          const outH = plotHeight - (yFor(d.clockOut) - PADDING_TOP);
          const showLabel = i === 0 || i === data.length - 1 || i === hoverIdx;

          return (
            <g
              key={d.date}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
            >
              <rect x={groupX - 2} y={PADDING_TOP} width={barWidth * 2 + 6} height={plotHeight} fill="transparent" />
              <rect
                x={groupX}
                y={yFor(d.clockIn)}
                width={barWidth}
                height={Math.max(inH, 0)}
                rx={3}
                fill={CLOCK_IN_COLOR}
                opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.45}
              />
              <rect
                x={groupX + barWidth + 2}
                y={yFor(d.clockOut)}
                width={barWidth}
                height={Math.max(outH, 0)}
                rx={3}
                fill={CLOCK_OUT_COLOR}
                opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.45}
              />
              {showLabel && (
                <text
                  x={groupX + barWidth + 1}
                  y={HEIGHT - 6}
                  fontSize={10}
                  textAnchor="middle"
                  fill="var(--muted)"
                >
                  {formatDayLabel(d.date)}
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
            left: `${((PADDING_LEFT + hoverIdx * groupWidth + groupWidth / 2) / WIDTH) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="mb-1 font-semibold text-foreground">{formatDayLabel(data[hoverIdx].date)}</p>
          <p className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: CLOCK_IN_COLOR }} />
            Clock In: {data[hoverIdx].clockIn}
          </p>
          <p className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: CLOCK_OUT_COLOR }} />
            Clock Out: {data[hoverIdx].clockOut}
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLOCK_IN_COLOR }} />
          Clock In
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLOCK_OUT_COLOR }} />
          Clock Out
        </span>
      </div>
    </div>
  );
}
