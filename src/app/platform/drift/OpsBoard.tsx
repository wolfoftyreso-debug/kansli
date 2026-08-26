"use client";

import { useEffect, useState } from "react";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { FAMILY_STATUS_LABEL } from "@/lib/platform/family";
import {
  seriesChangePct,
  seriesTotal,
  type OpsPoint,
  type OpsSnapshot,
} from "@/lib/platform/ops-view";

function when(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("sv-SE");
}

function hourLabel(value: string): string {
  return new Date(value).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function numberSv(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("sv-SE");
}

function changeCopy(
  current: number,
  previous: number,
): { text: string; tone: "up" | "down" | "flat" } {
  const pct = seriesChangePct(current, previous);
  if (pct == null || pct === 0) return { text: "samma som förra dygnet", tone: "flat" };
  const rounded = Math.abs(pct).toFixed(0);
  return {
    text: `${pct > 0 ? "+" : "−"}${rounded} %`,
    tone: pct > 0 ? "up" : "down",
  };
}

function ActivityChart({ points }: { points: OpsPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = points.map((point) => point.count);
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
  const axisHours = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
    (index, pos, list) => points[index] && list.indexOf(index) === pos,
  );
  const focus = hover ?? Math.max(0, points.length - 1);
  const focusPoint = points[focus];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full"
        role="img"
        aria-label="Händelser de senaste 24 timmarna"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const svgX = ((event.clientX - box.left) / box.width) * width;
          const t = (svgX - pad.left) / innerW;
          const index = Math.min(
            points.length - 1,
            Math.max(0, Math.round(t * Math.max(points.length - 1, 0))),
          );
          setHover(index);
        }}
      >
        <defs>
          <linearGradient id="ops-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
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
              {tick}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#ops-fill)" />
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
        {axisHours.map((index) => (
          <text
            key={points[index].at}
            x={x(index)}
            y={height - 6}
            textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
            className="fill-faint"
            fontSize="11"
          >
            {hourLabel(points[index].at)}
          </text>
        ))}
        {focusPoint ? (
          <g>
            <line
              x1={x(focus)}
              x2={x(focus)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="var(--color-ink)"
              strokeDasharray="2 3"
            />
            <circle cx={x(focus)} cy={y(focusPoint.count)} r="3.5" fill="var(--color-ink)" />
          </g>
        ) : null}
      </svg>
      {focusPoint ? (
        <div
          className="pointer-events-none absolute top-2 border border-line bg-surface px-2 py-1"
          style={{
            left: `${Math.min(82, Math.max(8, (x(focus) / width) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-mono text-xs text-faint">{hourLabel(focusPoint.at)}</p>
          <p className="text-sm font-medium tabular-nums">{numberSv(focusPoint.count)} händelser</p>
        </div>
      ) : null}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2"
      style={{ backgroundColor: ok ? "var(--color-status-operational)" : "var(--color-faint)" }}
    />
  );
}

function MetricCell({
  selected,
  label,
  value,
  hint,
  hintTone = "flat",
}: {
  selected?: boolean;
  label: string;
  value: string;
  hint: string;
  hintTone?: "up" | "down" | "flat";
}) {
  return (
    <div
      className={
        selected ? "border-b-2 border-ink px-4 py-5" : "border-b border-line px-4 py-5 sm:border-l"
      }
    >
      <p className="pd-label">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p
        className={
          hintTone === "up"
            ? "mt-1 text-sm text-[var(--color-status-operational)]"
            : hintTone === "down"
              ? "mt-1 text-sm text-[var(--color-status-development)]"
              : "mt-1 text-sm text-muted"
        }
      >
        {hint}
      </p>
    </div>
  );
}

function OpsView({ snapshot }: { snapshot: OpsSnapshot }) {
  const statusById = new Map(SYSTEM_MODULES.map((module) => [module.id, module.status]));
  const last24 = seriesTotal(snapshot.series);
  const change = changeCopy(last24, snapshot.previousWindow);
  const invoices =
    snapshot.tables.find((table) => table.schema === "ekonomi" && table.table === "invoices")
      ?.rows ?? null;
  const ready = snapshot.readiness.gates.filter((gate) => gate.state === "ready").length;
  const blocked = snapshot.readiness.gates.filter((gate) => gate.state === "blocked").length;
  const extra = snapshot.tables.filter((table) => !table.expected);
  const missing = snapshot.tables.filter((table) => table.expected && table.rows === null);

  return (
    <>
      <section className="border border-line bg-surface">
        <div className="grid sm:grid-cols-4">
          <MetricCell
            selected
            label="Händelser"
            value={numberSv(last24)}
            hint={`24 timmar · ${change.text}${change.tone === "flat" ? "" : " mot förra dygnet"}`}
            hintTone={change.tone}
          />
          <MetricCell
            label="Bolag"
            value={numberSv(snapshot.identity.organizations)}
            hint={`${numberSv(snapshot.identity.users)} användare`}
          />
          <MetricCell label="Fakturor" value={numberSv(invoices)} hint="rader i boken" />
          <MetricCell
            label="Beredskap"
            value={`${ready}/${snapshot.readiness.gates.length}`}
            hint={blocked === 0 ? "inget blockerat" : `${blocked} blockerade`}
          />
        </div>
        <div className="border-t border-line px-4 py-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="pd-label">Senaste dygnet</p>
            <p className="pd-label">24 timmar</p>
          </div>
          <ActivityChart points={snapshot.series} />
        </div>
      </section>

      <section className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface px-4 py-4">
          <p className="pd-label">Postgres</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <StatusDot ok={snapshot.health.database === "up"} />
            {snapshot.health.database === "up" ? "Svarar" : "Nere"}
          </p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="pd-label">RITA</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <StatusDot ok={snapshot.health.rita.available} />
            {snapshot.health.rita.available
              ? snapshot.health.rita.modelReady
                ? "regler + AI"
                : "bara regler"
              : "saknas"}
          </p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="pd-label">Anslutningar</p>
          <p className="mt-2 text-sm font-medium">
            Gateway {snapshot.health.gateway.configured ? snapshot.health.gateway.auth : "saknas"}
            {" · "}
            SMS {snapshot.health.sms ? "på" : "av"}
            {" · "}
            Revolut{" "}
            {snapshot.health.revolut.configured ? snapshot.health.revolut.environment : "av"}
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">Rum</h2>
            <p className="pd-label">Händelser</p>
          </div>
          <ul>
            {snapshot.events.map((item) => (
              <li
                key={item.system}
                className="flex items-baseline justify-between gap-3 border-b border-line py-3"
              >
                <div>
                  <p className="text-sm">{item.system}</p>
                  <p className="text-xs text-faint">
                    {FAMILY_STATUS_LABEL[statusById.get(item.system as never) ?? "pilot"] ?? ""}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{numberSv(item.count)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">Senast</h2>
            <p className="pd-label">Tid</p>
          </div>
          {snapshot.recent.length === 0 ? (
            <p className="py-3 text-sm text-muted">Inga händelser i det här fönstret.</p>
          ) : (
            <ul>
              {snapshot.recent.map((item) => (
                <li key={item.id} className="border-b border-line py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm">{item.headline ?? item.system}</p>
                    <p className="shrink-0 font-mono text-xs text-faint">{when(item.at)}</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-accent">{item.kind}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <details className="border border-line bg-surface px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
          Tabeller och scheman
        </summary>
        <p className="mt-3 text-sm text-ink-soft">
          En Postgres. Rollen {snapshot.contract.role}. Pin {snapshot.contract.pin}. Live count,
          inte uppskattning.
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {snapshot.schemas.map((schema) => (
            <li key={schema.schema} className="flex justify-between gap-3 text-sm">
              <span>{schema.schema}</span>
              <span className="font-mono text-xs text-faint">
                {schema.present ? `${schema.migrations.length} migrationer` : "saknas"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Tabeller och rader</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pd-label py-2 font-normal">Schema</th>
                <th className="pd-label py-2 font-normal">Tabell</th>
                <th className="pd-label py-2 text-right font-normal">Rader</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.tables.map((table) => (
                <tr key={`${table.schema}.${table.table}`} className="border-b border-line">
                  <td className="py-2 font-mono text-xs text-faint">{table.schema}</td>
                  <td className="py-2">{table.table}</td>
                  <td className="py-2 text-right tabular-nums">
                    {table.rows == null ? "—" : numberSv(table.rows)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {extra.length > 0 ? (
          <p className="mt-3 text-sm text-muted">
            Extra: {extra.map((table) => `${table.schema}.${table.table}`).join(", ")}
          </p>
        ) : null}
        {missing.length > 0 ? (
          <p className="mt-3 text-sm text-muted">
            Saknas: {missing.map((table) => `${table.schema}.${table.table}`).join(", ")}
          </p>
        ) : null}
      </details>

      <details className="border border-line bg-surface px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
          Beredskap och MCP
        </summary>
        <p className="mt-3 font-mono text-xs text-faint">
          MCP anrop {snapshot.health.mcp.mcp_requests_total} · verktyg{" "}
          {snapshot.health.mcp.mcp_tool_calls_total} · fel{" "}
          {snapshot.health.mcp.mcp_tool_errors_total}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {snapshot.readiness.gates.map((gate) => (
            <li key={gate.id} className="border-b border-line py-2">
              <div className="flex justify-between gap-3">
                <p className="text-sm font-medium">{gate.title}</p>
                <p className="pd-label">
                  {gate.state === "ready"
                    ? "Klar"
                    : gate.state === "blocked"
                      ? "Blockerad"
                      : "Öppen"}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{gate.detail}</p>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}

export function OpsBoard({ initial }: { initial: OpsSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const tick = async () => {
      try {
        const response = await fetch("/api/platform/ops", {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("Kunde inte läsa mätningen.");
        setSnapshot((await response.json()) as OpsSnapshot);
        setError(null);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Kunde inte läsa mätningen.");
      }
    };
    const id = window.setInterval(tick, 15_000);
    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="pd-label">
          {snapshot.scope === "house" ? "Flotta" : "Bolag"} · {snapshot.runtime}
          {snapshot.hardened ? " · härdad" : ""}
        </p>
        <p className="pd-label">{when(snapshot.takenAt)}</p>
      </div>
      {error ? <p className="text-sm text-muted">{error}</p> : null}
      <OpsView snapshot={snapshot} />
    </div>
  );
}
