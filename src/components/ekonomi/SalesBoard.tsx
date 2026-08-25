"use client";

import { useMemo, useState } from "react";
import { formatSek } from "@/lib/ekonomi/money";
import {
  PERIODS,
  formatSekCompact,
  periodSummary,
  previousWindow,
  sliceLedger,
  type DayPoint,
  type PeriodId,
} from "@/lib/ekonomi/series";

type SeriesKey = "sales" | "received";

export function SalesBoard({ points }: { points: DayPoint[] }) {
  const [period, setPeriod] = useState<PeriodId>("1M");
  const [startPct, setStartPct] = useState(0);
  const [endPct, setEndPct] = useState(100);
  const [hover, setHover] = useState<number | null>(null);
  const [series, setSeries] = useState<SeriesKey>("sales");

  const visible = useMemo(
    () => sliceLedger(points, period, startPct, endPct),
    [points, period, startPct, endPct],
  );
  const previous = useMemo(() => previousWindow(points, period), [points, period]);
  const summary = useMemo(() => periodSummary(visible, previous), [visible, previous]);

  const values = visible.map((point) =>
    series === "sales" ? point.salesCumOre : point.receivedCumOre,
  );
  const latest = values.at(-1) ?? 0;
  const change = summary.changeOre;
  const up = change > 0;
  const down = change < 0;

  if (points.length === 0) {
    return (
      <section className="rounded-2xl border border-line bg-surface px-5 py-6">
        <p className="pd-label">Försäljning</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">0,00 kr</p>
        <p className="mt-2 text-sm text-muted">
          Kurvan fylls när en faktura är utfärdad. Utkast syns inte här.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-surface px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="pd-label">{series === "sales" ? "Försäljning" : "Inbetalningar"}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
            {formatSek(latest)}
          </p>
          <p
            className={
              up
                ? "mt-1 text-sm text-[var(--color-status-operational)]"
                : down
                  ? "mt-1 text-sm text-[var(--color-status-development)]"
                  : "mt-1 text-sm text-muted"
            }
          >
            {up ? "+" : ""}
            {formatSek(change)}
            {summary.changePct == null
              ? ""
              : ` (${summary.changePct.toFixed(1).replace(".", ",")} %)`}
            {" · "}
            mot förra perioden
          </p>
        </div>
        <div className="flex rounded-full border border-line p-1 text-sm">
          <button
            type="button"
            className={
              series === "sales"
                ? "rounded-full bg-ink px-3 py-1 text-paper"
                : "px-3 py-1 text-ink-soft"
            }
            onClick={() => setSeries("sales")}
          >
            Sålt
          </button>
          <button
            type="button"
            className={
              series === "received"
                ? "rounded-full bg-ink px-3 py-1 text-paper"
                : "px-3 py-1 text-ink-soft"
            }
            onClick={() => setSeries("received")}
          >
            Inbetalt
          </button>
        </div>
      </div>

      <SalesChart points={visible} series={series} hover={hover} onHover={setHover} />

      <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Period">
        {PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              period === item.id
                ? "rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent"
                : "rounded-full px-3 py-1 text-sm text-ink-soft hover:bg-paper"
            }
            onClick={() => {
              setPeriod(item.id);
              setStartPct(0);
              setEndPct(100);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="ek-range mt-5">
        <label className="sr-only" htmlFor="ek-range-start">
          Början av grafen
        </label>
        <input
          id="ek-range-start"
          type="range"
          min={0}
          max={99}
          value={startPct}
          onChange={(event) => {
            const next = Number(event.target.value);
            setStartPct(Math.min(next, endPct - 1));
          }}
        />
        <label className="sr-only" htmlFor="ek-range-end">
          Slutet av grafen
        </label>
        <input
          id="ek-range-end"
          type="range"
          min={1}
          max={100}
          value={endPct}
          onChange={(event) => {
            const next = Number(event.target.value);
            setEndPct(Math.max(next, startPct + 1));
          }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        {visible[0]?.date ?? "—"} – {visible.at(-1)?.date ?? "—"}
        {hover != null && visible[hover]
          ? ` · ${visible[hover].date}: sålt ${formatSek(visible[hover].salesOre)}, inbetalt ${formatSek(visible[hover].receivedOre)}`
          : ""}
      </p>
    </section>
  );
}

function SalesChart({
  points,
  series,
  hover,
  onHover,
}: {
  points: DayPoint[];
  series: SeriesKey;
  hover: number | null;
  onHover: (index: number | null) => void;
}) {
  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = points.map((point) =>
    series === "sales" ? point.salesCumOre : point.receivedCumOre,
  );
  const max = Math.max(...values, 1);
  const x = (index: number) =>
    pad.left + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (value: number) => pad.top + innerH - (value / max) * innerH;
  const line = values
    .map(
      (value, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L ${x(values.length - 1).toFixed(1)} ${pad.top + innerH} L ${x(0).toFixed(1)} ${pad.top + innerH} Z`;
  const ticks = [0, 0.5, 1].map((part) => Math.round(max * part));

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        role="img"
        aria-label="Försäljningskurva"
        onMouseLeave={() => onHover(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - box.left) / box.width;
          const index = Math.min(
            points.length - 1,
            Math.max(0, Math.round(ratio * (points.length - 1))),
          );
          onHover(index);
        }}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-line)"
              strokeDasharray="3 4"
            />
            <text
              x={pad.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-muted"
              fontSize="11"
            >
              {formatSekCompact(tick)}
            </text>
          </g>
        ))}
        <path d={area} fill="var(--color-accent-soft)" />
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
        {hover != null && values[hover] != null ? (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="var(--color-ink)"
              strokeDasharray="2 3"
            />
            <circle cx={x(hover)} cy={y(values[hover]!)} r="4" fill="var(--color-accent)" />
          </g>
        ) : null}
        {points.length > 1 ? (
          <>
            <text x={pad.left} y={height - 8} className="fill-muted" fontSize="11">
              {points[0]?.date}
            </text>
            <text
              x={width - pad.right}
              y={height - 8}
              textAnchor="end"
              className="fill-muted"
              fontSize="11"
            >
              {points.at(-1)?.date}
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}
