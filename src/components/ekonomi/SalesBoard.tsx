"use client";

import { useMemo, useState } from "react";
import { formatSek } from "@/lib/ekonomi/money";
import {
  PERIODS,
  formatChartDay,
  formatChartRange,
  formatSekCompact,
  periodSummary,
  periodWindow,
  previousWindow,
  sliceLedger,
  type DayPoint,
  type PeriodId,
} from "@/lib/ekonomi/series";

type SeriesKey = "sales" | "received";
type ChartMode = "vol" | "platt";

const CHART = {
  top: "var(--color-chart-ink-top)",
  front: "var(--color-chart-ink-front)",
  side: "var(--color-chart-ink-side)",
  focusTop: "var(--color-chart-accent-top)",
  focusFront: "var(--color-chart-accent-front)",
  focusSide: "var(--color-chart-accent-side)",
  line: "var(--color-chart-accent-front)",
};

function seriesValue(point: DayPoint, series: SeriesKey, mode: "day" | "cum"): number {
  if (series === "sales") return mode === "day" ? point.salesOre : point.salesCumOre;
  return mode === "day" ? point.receivedOre : point.receivedCumOre;
}

export function SalesBoard({ points }: { points: DayPoint[] }) {
  const [period, setPeriod] = useState<PeriodId>("1M");
  const [startPct, setStartPct] = useState(0);
  const [endPct, setEndPct] = useState(100);
  const [hover, setHover] = useState<number | null>(null);
  const [series, setSeries] = useState<SeriesKey>("sales");
  const [mode, setMode] = useState<ChartMode>("vol");

  const windowed = useMemo(() => periodWindow(points, period), [points, period]);
  const visible = useMemo(
    () => sliceLedger(points, period, startPct, endPct),
    [points, period, startPct, endPct],
  );
  const previous = useMemo(() => previousWindow(points, period), [points, period]);
  const summary = useMemo(() => periodSummary(visible, previous), [visible, previous]);

  const focusIndex = hover ?? Math.max(0, visible.length - 1);
  const focus = visible[focusIndex];
  const latest = focus ? seriesValue(focus, series, "cum") : 0;
  const change = series === "sales" ? summary.changeOre : summary.receivedChangeOre;
  const changePct = series === "sales" ? summary.changePct : summary.receivedChangePct;
  const up = change > 0;
  const down = change < 0;
  const activeDays = visible.filter((point) => seriesValue(point, series, "day") > 0).length;

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
            {hover != null && focus ? (
              <>
                {formatChartDay(focus.date)}
                {" · "}
                dagen {formatSek(seriesValue(focus, series, "day"))}
              </>
            ) : (
              <>
                {up ? "+" : ""}
                {formatSek(change)}
                {changePct == null ? "" : ` (${changePct.toFixed(1).replace(".", ",")} %)`}
                {" · "}
                mot förra perioden
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex border border-line text-sm">
            <button
              type="button"
              className={
                series === "sales" ? "bg-ink px-3 py-1 text-paper" : "px-3 py-1 text-ink-soft"
              }
              onClick={() => setSeries("sales")}
            >
              Sålt
            </button>
            <button
              type="button"
              className={
                series === "received" ? "bg-ink px-3 py-1 text-paper" : "px-3 py-1 text-ink-soft"
              }
              onClick={() => setSeries("received")}
            >
              Inbetalt
            </button>
          </div>
          <div className="flex border border-line text-xs">
            <button
              type="button"
              className={mode === "vol" ? "bg-ink px-2 py-1 text-paper" : "px-2 py-1 text-ink-soft"}
              onClick={() => setMode("vol")}
            >
              Volym
            </button>
            <button
              type="button"
              className={
                mode === "platt" ? "bg-ink px-2 py-1 text-paper" : "px-2 py-1 text-ink-soft"
              }
              onClick={() => setMode("platt")}
            >
              Platt
            </button>
          </div>
        </div>
      </div>

      <SalesChart points={visible} series={series} mode={mode} hover={hover} onHover={setHover} />

      <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Period">
        {PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              period === item.id
                ? "bg-ink px-3 py-1 text-sm font-medium text-paper"
                : "px-3 py-1 text-sm text-ink-soft hover:bg-paper"
            }
            onClick={() => {
              setPeriod(item.id);
              setStartPct(0);
              setEndPct(100);
              setHover(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <RangeBrush
        points={windowed}
        series={series}
        startPct={startPct}
        endPct={endPct}
        onStart={setStartPct}
        onEnd={setEndPct}
      />

      <p className="mt-2 text-xs text-muted">
        {formatChartRange(visible[0]?.date ?? "", visible.at(-1)?.date ?? "")}
        {activeDays <= 1
          ? series === "sales"
            ? " · Alla sälj i fönstret ligger på samma dag."
            : " · Alla inbetalningar i fönstret ligger på samma dag."
          : ` · ${activeDays} dagar med ${series === "sales" ? "sälj" : "inbetalning"}`}
      </p>
    </section>
  );
}

function poly(points: string, fill: string) {
  return <polygon points={points} fill={fill} />;
}

function extrudedBar(
  x: number,
  yb: number,
  w: number,
  h: number,
  tones: { top: string; front: string; side: string },
) {
  const dx = Math.max(4, w * 0.35);
  const dy = Math.max(2, dx * 0.5);
  const top = `${x},${yb - h} ${x + w},${yb - h} ${x + w + dx},${yb - h - dy} ${x + dx},${yb - h - dy}`;
  const front = `${x},${yb - h} ${x + w},${yb - h} ${x + w},${yb} ${x},${yb}`;
  const side = `${x + w},${yb - h} ${x + w + dx},${yb - h - dy} ${x + w + dx},${yb - dy} ${x + w},${yb}`;
  return (
    <g>
      {poly(top, tones.top)}
      {poly(front, tones.front)}
      {poly(side, tones.side)}
    </g>
  );
}

function SalesChart({
  points,
  series,
  mode,
  hover,
  onHover,
}: {
  points: DayPoint[];
  series: SeriesKey;
  mode: ChartMode;
  hover: number | null;
  onHover: (index: number | null) => void;
}) {
  const width = 720;
  const height = 248;
  const pad = { top: 18, right: 28, bottom: 44, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = points.map((point) => seriesValue(point, series, "cum"));
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
  const ticks = [0, 0.33, 0.66, 1].map((part) => Math.round(max * part));
  const step = points.length <= 1 ? innerW : innerW / (points.length - 1);
  const barW = Math.max(6, Math.min(28, step * 0.55));
  const hoverPoint = hover != null ? points[hover] : null;
  const hoverLeft =
    hover != null ? Math.min(86, Math.max(8, ((x(hover) - pad.left) / innerW) * 100)) : 0;
  const axisYear = Boolean(
    points[0] && points.at(-1) && points[0].date.slice(0, 4) !== points.at(-1)!.date.slice(0, 4),
  );
  const base = pad.top + innerH;

  return (
    <div className="relative mt-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        role="img"
        aria-label="Sales chart"
        onMouseLeave={() => onHover(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const svgX = ((event.clientX - box.left) / box.width) * width;
          const t = (svgX - pad.left) / innerW;
          const index = Math.min(
            points.length - 1,
            Math.max(0, Math.round(t * Math.max(points.length - 1, 0))),
          );
          onHover(index);
        }}
      >
        <line x1={pad.left} x2={width - pad.right} y1={base} y2={base} stroke="var(--color-line)" />
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
        {mode === "vol" ? (
          points.map((point, index) => {
            const value = values[index] ?? 0;
            const h = Math.max(value > 0 ? 4 : 0, (value / max) * innerH);
            if (h <= 0) return null;
            const tones =
              index === (hover ?? points.length - 1)
                ? { top: CHART.focusTop, front: CHART.focusFront, side: CHART.focusSide }
                : { top: CHART.top, front: CHART.front, side: CHART.side };
            return <g key={point.date}>{extrudedBar(x(index) - barW / 2, base, barW, h, tones)}</g>;
          })
        ) : (
          <>
            <path d={area} fill="var(--color-chart-accent-top)" opacity="0.18" />
            <path d={line} fill="none" stroke={CHART.line} strokeWidth="2" />
            {hover != null && values[hover] != null ? (
              <circle cx={x(hover)} cy={y(values[hover]!)} r="4" fill={CHART.focusSide} />
            ) : null}
          </>
        )}
        {points.length > 1 ? (
          <>
            <text x={pad.left} y={height - 6} className="fill-muted" fontSize="11">
              {formatChartDay(points[0]?.date ?? "", axisYear)}
            </text>
            <text
              x={width - pad.right}
              y={height - 6}
              textAnchor="end"
              className="fill-muted"
              fontSize="11"
            >
              {formatChartDay(points.at(-1)?.date ?? "", axisYear)}
            </text>
          </>
        ) : null}
      </svg>
      {hoverPoint ? (
        <div
          className="pointer-events-none absolute top-3 min-w-40 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-sm"
          style={{ left: `${hoverLeft}%` }}
        >
          <p className="font-medium">{formatChartDay(hoverPoint.date)}</p>
          <p className="mt-1 text-ink-soft">
            Dagen {formatSek(seriesValue(hoverPoint, series, "day"))}
          </p>
          <p className="text-ink-soft">
            Hittills {formatSek(seriesValue(hoverPoint, series, "cum"))}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RangeBrush({
  points,
  series,
  startPct,
  endPct,
  onStart,
  onEnd,
}: {
  points: DayPoint[];
  series: SeriesKey;
  startPct: number;
  endPct: number;
  onStart: (value: number) => void;
  onEnd: (value: number) => void;
}) {
  const width = 720;
  const height = 48;
  const values = points.map((point) => seriesValue(point, series, "cum"));
  const max = Math.max(...values, 1);
  const x = (index: number) =>
    points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width;
  const y = (value: number) => height - 4 - (value / max) * (height - 8);
  const line = values
    .map(
      (value, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L ${x(values.length - 1).toFixed(1)} ${height} L ${x(0).toFixed(1)} ${height} Z`;

  return (
    <div className="ek-brush mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="ek-brush-spark" aria-hidden>
        <path d={area} fill="var(--color-chart-accent-top)" opacity="0.22" />
        <path d={line} fill="none" stroke="var(--color-chart-accent-front)" strokeWidth="1.4" />
        <rect
          x={(startPct / 100) * width}
          y="0"
          width={Math.max(8, ((endPct - startPct) / 100) * width)}
          height={height}
          fill="var(--color-chart-ink-front)"
          opacity="0.1"
        />
        <rect
          x={(startPct / 100) * width}
          y="0"
          width="2"
          height={height}
          fill="var(--color-chart-ink-front)"
        />
        <rect
          x={(endPct / 100) * width - 2}
          y="0"
          width="2"
          height={height}
          fill="var(--color-chart-ink-front)"
        />
      </svg>
      <div className="ek-range">
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
            onStart(Math.min(next, endPct - 1));
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
            onEnd(Math.max(next, startPct + 1));
          }}
        />
      </div>
    </div>
  );
}
