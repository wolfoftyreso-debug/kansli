"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { formatSek } from "@/lib/ekonomi/money";
import { FAMILY_STATUS_LABEL } from "@/lib/platform/family";
import type { OpsDebugLookup, OpsQueueCounts } from "@/lib/platform/ops-debug-view";
import {
  OPS_SMS_KIND_LABEL,
  seriesChangePct,
  seriesTotal,
  type OpsNotice,
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
  const focus = hover;
  const focusPoint = focus == null ? null : points[focus];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full sm:h-52"
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

const QUEUE_STATUS: Record<string, string> = {
  PENDING: "Väntar",
  SENT: "Skickat",
  FAILED: "Misslyckades",
  BLOCKED: "Stoppat",
};

function queueHint(counts: OpsQueueCounts): string {
  if (counts.failed + counts.blocked > 0) {
    return `${counts.failed + counts.blocked} stoppade`;
  }
  if (counts.pending > 0) return `${counts.pending} väntar`;
  if (counts.sent > 0) return `${counts.sent} skickade`;
  return "tom kö";
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
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{value}</p>
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

function DeskNotice({ notice }: { notice: OpsNotice }) {
  const box =
    notice.level === "larm"
      ? "border-line-strong bg-accent-soft"
      : notice.level === "varning"
        ? "border-line bg-surface"
        : "border-line bg-accent-soft";
  return (
    <div className={`border px-4 py-3 ${box}`}>
      <p className="pd-label">{notice.level}</p>
      <p className="mt-1 text-base font-medium">{notice.title}</p>
      <p className="mt-1 text-sm text-ink-soft">{notice.detail}</p>
      {notice.href ? (
        <Link
          href={notice.href}
          className="mt-3 inline-flex min-h-11 items-center text-sm underline decoration-line underline-offset-4"
        >
          {notice.hrefLabel ?? "Öppna"}
        </Link>
      ) : null}
    </div>
  );
}

function OpsView({ snapshot }: { snapshot: OpsSnapshot }) {
  const statusById = new Map(SYSTEM_MODULES.map((module) => [module.id, module.status]));
  const last24 = seriesTotal(snapshot.series);
  const change = changeCopy(last24, snapshot.previousWindow);
  const ready = snapshot.readiness.gates.filter((gate) => gate.state === "ready").length;
  const blocked = snapshot.readiness.gates.filter((gate) => gate.state === "blocked").length;
  const extra = snapshot.tables.filter((table) => !table.expected);
  const missing = snapshot.tables.filter((table) => table.expected && table.rows === null);
  const openOre = snapshot.ledger.notDueOre + snapshot.ledger.overdueOre;
  const alarmsOn = snapshot.sms.routes.filter((route) => route.enabled).length;

  return (
    <>
      {snapshot.notices.length > 0 ? (
        <section className="flex flex-col gap-2" aria-label="Notiser">
          {snapshot.notices.map((notice) => (
            <DeskNotice key={notice.id} notice={notice} />
          ))}
        </section>
      ) : (
        <p className="border border-line bg-accent-soft px-4 py-3 text-sm text-ink-soft">
          Inget larm just nu. Reskontra, ärenden och rutter syns nedan.
        </p>
      )}

      <section className="border border-line bg-surface">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          <MetricCell
            selected
            label="Händelser"
            value={numberSv(last24)}
            hint={`24 timmar · ${change.text}${change.tone === "flat" ? "" : " mot förra dygnet"}`}
            hintTone={change.tone}
          />
          <MetricCell
            label="Förfallet"
            value={formatSek(snapshot.ledger.overdueOre)}
            hint={
              snapshot.ledger.overdueCount === 0
                ? "inget förfallet"
                : `${snapshot.ledger.overdueCount} ${snapshot.ledger.overdueCount === 1 ? "faktura" : "fakturor"}`
            }
            hintTone={snapshot.ledger.overdueOre > 0 ? "down" : "flat"}
          />
          <MetricCell
            label="Reskontra"
            value={formatSek(openOre)}
            hint={`${snapshot.ledger.openCount} öppna fakturor`}
          />
          <MetricCell
            label="Ärenden"
            value={numberSv(snapshot.support.open)}
            hint={
              snapshot.support.open === 0
                ? "inget öppet"
                : `${snapshot.support.cases} TYRA · ${snapshot.support.tasks} Kansli`
            }
          />
          <MetricCell
            label="Larm"
            value={`${alarmsOn}/${snapshot.sms.routes.length}`}
            hint={snapshot.sms.vendor ? "telefon kopplad" : "telefon saknas"}
          />
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

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">Reskontra</h2>
            <Link
              href="/ekonomi"
              className="min-h-11 text-sm underline decoration-line underline-offset-4"
            >
              Boken
            </Link>
          </div>
          {snapshot.ledger.overdue.length === 0 ? (
            <p className="py-3 text-sm text-muted">Inget förfallet i det här fönstret.</p>
          ) : (
            <ul>
              {snapshot.ledger.overdue.map((invoice) => (
                <li key={invoice.id} className="border-b border-line py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={invoice.href}
                      className="min-h-11 text-sm underline decoration-line underline-offset-4"
                    >
                      {invoice.number} · {invoice.customerName}
                    </Link>
                    <p className="shrink-0 text-sm tabular-nums">{formatSek(invoice.openOre)}</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-faint">
                    Förföll {invoice.dueAt ? when(invoice.dueAt) : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">Ärenden</h2>
            <Link
              href="/kansli"
              className="min-h-11 text-sm underline decoration-line underline-offset-4"
            >
              Kansli
            </Link>
          </div>
          {snapshot.support.items.length === 0 ? (
            <p className="py-3 text-sm text-muted">Inga öppna ärenden i det här fönstret.</p>
          ) : (
            <ul>
              {snapshot.support.items.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="border-b border-line py-3">
                  <Link
                    href={item.href}
                    className="min-h-11 text-sm underline decoration-line underline-offset-4"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-faint">
                    {item.detail} · {when(item.at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border border-line bg-surface">
        <div className="grid sm:grid-cols-3">
          <MetricCell
            label="Sälj-SMS"
            value={numberSv(
              snapshot.queues.sales.pending +
                snapshot.queues.sales.failed +
                snapshot.queues.sales.blocked,
            )}
            hint={queueHint(snapshot.queues.sales)}
            hintTone={
              snapshot.queues.sales.failed + snapshot.queues.sales.blocked > 0 ? "down" : "flat"
            }
          />
          <MetricCell
            label="Driftslarm"
            value={numberSv(
              snapshot.queues.alarms.pending +
                snapshot.queues.alarms.failed +
                snapshot.queues.alarms.blocked,
            )}
            hint={queueHint(snapshot.queues.alarms)}
            hintTone={
              snapshot.queues.alarms.failed + snapshot.queues.alarms.blocked > 0 ? "down" : "flat"
            }
          />
          <MetricCell
            label="Däckpåminnelser"
            value={numberSv(
              snapshot.queues.reminders.pending +
                snapshot.queues.reminders.failed +
                snapshot.queues.reminders.blocked,
            )}
            hint={queueHint(snapshot.queues.reminders)}
            hintTone={
              snapshot.queues.reminders.failed + snapshot.queues.reminders.blocked > 0
                ? "down"
                : "flat"
            }
          />
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
          <h2 className="text-lg font-semibold">Senaste fel</h2>
          <p className="pd-label">Misslyckat och stoppat</p>
        </div>
        {snapshot.lastErrors.length === 0 ? (
          <p className="py-3 text-sm text-muted">Inga fel i det här fönstret.</p>
        ) : (
          <ul>
            {snapshot.lastErrors.slice(0, 8).map((item) => (
              <li key={`${item.system}-${item.id}`} className="border-b border-line py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm">{item.headline ?? item.kind}</p>
                  <p className="shrink-0 font-mono text-xs text-faint">{when(item.at)}</p>
                </div>
                <p className="mt-1 font-mono text-xs text-accent">{item.kind}</p>
                {item.requestId ? (
                  <p className="mt-1 break-all font-mono text-xs text-faint">{item.requestId}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
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
        <summary className="min-h-11 cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
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
        <summary className="min-h-11 cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
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
        <ul className="mt-3 text-sm text-muted">
          {snapshot.sms.routes
            .filter((route) => route.enabled)
            .map((route) => (
              <li key={route.kind}>
                {OPS_SMS_KIND_LABEL[route.kind]} → {route.phone || "inget nummer"}
              </li>
            ))}
        </ul>
      </details>
    </>
  );
}

function RuntimeMarks({ snapshot }: { snapshot: OpsSnapshot }) {
  const marks = snapshot.runtimeDebug;
  const flags = [
    marks.hardened ? "härdad" : "öppen",
    marks.seedDemo ? "demofrö" : null,
    marks.cronSet ? "cron satt" : "cron saknas",
    marks.smsSet ? "sms på" : "sms av",
    marks.sessionSecretSet ? "session satt" : "session saknas",
    marks.cookieSecure ? "cookie låst" : "cookie öppen",
  ].filter(Boolean);
  return (
    <p className="text-sm text-muted">
      {marks.mark}
      {marks.vercelEnv ? ` · ${marks.vercelEnv}` : ""}
      {marks.appEnv ? ` · ${marks.appEnv}` : ""}
      {" · "}
      {flags.join(" · ")}
    </p>
  );
}

function OpsSearch() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OpsDebugLookup | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/platform/ops/debug?q=${encodeURIComponent(q.trim())}`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("Kunde inte söka.");
      setResult((await response.json()) as OpsDebugLookup);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Kunde inte söka.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-line bg-surface px-4 py-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-soft">Sök request-id eller ärende</span>
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            minLength={3}
            placeholder="Minst tre tecken"
            className="min-h-12 w-full border border-line bg-paper px-4 py-3 text-base"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <button
          type="submit"
          disabled={busy || q.trim().length < 3}
          className="min-h-12 w-full bg-ink px-4 py-3 text-base font-medium text-paper hover:bg-ink-soft disabled:opacity-50 sm:w-auto"
        >
          {busy ? "Söker…" : "Sök"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}
      {result?.note ? <p className="mt-3 text-sm text-muted">{result.note}</p> : null}
      {result && result.events.length + result.outbox.length > 0 ? (
        <ul className="mt-4">
          {result.events.map((item) => (
            <li key={`event-${item.id}`} className="border-b border-line py-3">
              <p className="text-sm">{item.kind}</p>
              <p className="mt-1 font-mono text-xs text-faint">
                {item.system} · {when(item.at)}
                {item.requestId ? ` · ${item.requestId}` : ""}
              </p>
            </li>
          ))}
          {result.outbox.map((item) => (
            <li key={`outbox-${item.source}-${item.id}`} className="border-b border-line py-3">
              <p className="pd-label">{QUEUE_STATUS[item.status] ?? item.status}</p>
              <p className="mt-1 text-sm">{item.body}</p>
              {item.lastError ? <p className="mt-1 text-sm text-muted">{item.lastError}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function OpsBoard({ initial }: { initial: OpsSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

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
        setRequestId(response.headers.get("x-request-id"));
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
      <RuntimeMarks snapshot={snapshot} />
      {requestId ? (
        <p className="break-all font-mono text-xs text-faint">Senaste mätning · {requestId}</p>
      ) : null}
      {error ? <p className="text-sm text-muted">{error}</p> : null}
      <OpsSearch />
      <OpsView snapshot={snapshot} />
    </div>
  );
}
