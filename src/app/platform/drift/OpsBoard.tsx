"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { formatSek } from "@/lib/ekonomi/money";
import {
  DEFAULT_LOCALE,
  familyStatusLabel,
  localeTag,
  opsNoticeLevel,
  opsQueueStatus,
  opsSmsKindLabel,
  t,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";
import type { OpsDebugLookup, OpsQueueCounts } from "@/lib/platform/ops-debug-view";
import {
  seriesChangePct,
  seriesTotal,
  type OpsNotice,
  type OpsPoint,
  type OpsSnapshot,
} from "@/lib/platform/ops-view";
import { useNarrow } from "@/components/app/useNarrow";

function when(value: string | null, locale: Locale): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(localeTag(locale));
}

function hourLabel(value: string, locale: Locale): string {
  return new Date(value).toLocaleTimeString(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number | null | undefined, locale: Locale): string {
  if (value == null) return "—";
  return value.toLocaleString(localeTag(locale));
}

function changeCopy(
  locale: Locale,
  current: number,
  previous: number,
): { text: string; tone: "up" | "down" | "flat" } {
  const pct = seriesChangePct(current, previous);
  if (pct == null || pct === 0) return { text: t(locale, "ops.change.same"), tone: "flat" };
  const rounded = Math.abs(pct).toFixed(0);
  return {
    text: `${pct > 0 ? "+" : "−"}${rounded} %`,
    tone: pct > 0 ? "up" : "down",
  };
}

function queueHint(locale: Locale, counts: OpsQueueCounts): string {
  if (counts.failed + counts.blocked > 0) {
    return t(locale, "ops.queue.stopped", { count: counts.failed + counts.blocked });
  }
  if (counts.pending > 0) return t(locale, "ops.queue.pending", { count: counts.pending });
  if (counts.sent > 0) return t(locale, "ops.queue.sent", { count: counts.sent });
  return t(locale, "ops.queue.empty");
}

function ActivityChart({ points, locale }: { points: OpsPoint[]; locale: Locale }) {
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
  const narrow = useNarrow();
  const ticks = (narrow ? [0, 1] : [0, 0.5, 1]).map((part) => Math.round(max * part));
  const tickSize = narrow ? 20 : 12;
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
        aria-label={t(locale, "ops.chartAria")}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const svgX = ((event.clientX - box.left) / box.width) * width;
          const frac = (svgX - pad.left) / innerW;
          const index = Math.min(
            points.length - 1,
            Math.max(0, Math.round(frac * Math.max(points.length - 1, 0))),
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
              fontSize={tickSize}
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
            fontSize={tickSize}
          >
            {hourLabel(points[index].at, locale)}
          </text>
        ))}
        {focus != null && focusPoint ? (
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
      {focus != null && focusPoint ? (
        <div
          className="pointer-events-none absolute top-2 border border-line bg-surface px-2 py-1"
          style={{
            left: `${Math.min(82, Math.max(8, (x(focus) / width) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-mono text-xs text-faint">{hourLabel(focusPoint.at, locale)}</p>
          <p className="text-sm font-medium tabular-nums">
            {t(locale, "ops.chartEvents", { count: formatNumber(focusPoint.count, locale) })}
          </p>
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

function DeskNotice({ notice, locale }: { notice: OpsNotice; locale: Locale }) {
  const box =
    notice.level === "larm"
      ? "border-line-strong bg-accent-soft"
      : notice.level === "varning"
        ? "border-line bg-surface"
        : "border-line bg-accent-soft";
  return (
    <div className={`border px-4 py-3 ${box}`}>
      <p className="pd-label">{opsNoticeLevel(locale, notice.level)}</p>
      <p className="mt-1 text-base font-medium">{notice.title}</p>
      <p className="mt-1 text-sm text-ink-soft">{notice.detail}</p>
      {notice.href ? (
        <Link
          href={notice.href}
          className="mt-3 inline-flex min-h-11 items-center text-sm underline decoration-line underline-offset-4"
        >
          {notice.hrefLabel ?? t(locale, "ops.open")}
        </Link>
      ) : null}
    </div>
  );
}

function OpsView({ snapshot, locale }: { snapshot: OpsSnapshot; locale: Locale }) {
  const statusById = new Map(SYSTEM_MODULES.map((module) => [module.id, module.status]));
  const last24 = seriesTotal(snapshot.series);
  const change = changeCopy(locale, last24, snapshot.previousWindow);
  const ready = snapshot.readiness.gates.filter((gate) => gate.state === "ready").length;
  const blocked = snapshot.readiness.gates.filter((gate) => gate.state === "blocked").length;
  const extra = snapshot.tables.filter((table) => !table.expected);
  const missing = snapshot.tables.filter((table) => table.expected && table.rows === null);
  const openOre = snapshot.ledger.notDueOre + snapshot.ledger.overdueOre;
  const alarmsOn = snapshot.sms.routes.filter((route) => route.enabled).length;
  const changeHint =
    change.tone === "flat" ? change.text : `${change.text}${t(locale, "ops.change.vsPrev")}`;

  return (
    <>
      {snapshot.notices.length > 0 ? (
        <section className="flex flex-col gap-2" aria-label={t(locale, "ops.notices")}>
          {snapshot.notices.map((notice) => (
            <DeskNotice key={notice.id} notice={notice} locale={locale} />
          ))}
        </section>
      ) : (
        <p className="border border-line bg-accent-soft px-4 py-3 text-sm text-ink-soft">
          {t(locale, "ops.noAlarm")}
        </p>
      )}

      <section className="border border-line bg-surface">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          <MetricCell
            selected
            label={t(locale, "ops.metric.events")}
            value={formatNumber(last24, locale)}
            hint={t(locale, "ops.hint.hours", { change: changeHint })}
            hintTone={change.tone}
          />
          <MetricCell
            label={t(locale, "ops.metric.overdue")}
            value={formatSek(snapshot.ledger.overdueOre)}
            hint={
              snapshot.ledger.overdueCount === 0
                ? t(locale, "ops.overdue.none")
                : snapshot.ledger.overdueCount === 1
                  ? t(locale, "ops.overdue.one")
                  : t(locale, "ops.overdue.many", { count: snapshot.ledger.overdueCount })
            }
            hintTone={snapshot.ledger.overdueOre > 0 ? "down" : "flat"}
          />
          <MetricCell
            label={t(locale, "ops.metric.ledger")}
            value={formatSek(openOre)}
            hint={t(locale, "ops.ledger.open", { count: snapshot.ledger.openCount })}
          />
          <MetricCell
            label={t(locale, "ops.metric.cases")}
            value={formatNumber(snapshot.support.open, locale)}
            hint={
              snapshot.support.open === 0
                ? t(locale, "ops.cases.none")
                : t(locale, "ops.cases.split", {
                    cases: snapshot.support.cases,
                    tasks: snapshot.support.tasks,
                  })
            }
          />
          <MetricCell
            label={t(locale, "ops.metric.alarms")}
            value={`${alarmsOn}/${snapshot.sms.routes.length}`}
            hint={snapshot.sms.vendor ? t(locale, "ops.alarms.on") : t(locale, "ops.alarms.off")}
          />
          <MetricCell
            label={t(locale, "ops.metric.readiness")}
            value={`${ready}/${snapshot.readiness.gates.length}`}
            hint={
              blocked === 0
                ? t(locale, "ops.readiness.none")
                : t(locale, "ops.readiness.blocked", { count: blocked })
            }
          />
        </div>
        <div className="border-t border-line px-4 py-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="pd-label">{t(locale, "ops.last24h")}</p>
            <p className="pd-label">{t(locale, "ops.hours24")}</p>
          </div>
          <ActivityChart points={snapshot.series} locale={locale} />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">{t(locale, "ops.ledger")}</h2>
            <Link
              href="/ekonomi"
              className="min-h-11 text-sm underline decoration-line underline-offset-4"
            >
              {t(locale, "ops.book")}
            </Link>
          </div>
          {snapshot.ledger.overdue.length === 0 ? (
            <p className="py-3 text-sm text-muted">{t(locale, "ops.ledger.empty")}</p>
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
                    {t(locale, "ops.due", {
                      when: invoice.dueAt ? when(invoice.dueAt, locale) : "—",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">{t(locale, "ops.cases")}</h2>
            <Link
              href="/kansli"
              className="min-h-11 text-sm underline decoration-line underline-offset-4"
            >
              {t(locale, "ops.kansli")}
            </Link>
          </div>
          {snapshot.support.items.length === 0 ? (
            <p className="py-3 text-sm text-muted">{t(locale, "ops.cases.empty")}</p>
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
                    {item.detail} · {when(item.at, locale)}
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
            label={t(locale, "ops.queue.sales")}
            value={formatNumber(
              snapshot.queues.sales.pending +
                snapshot.queues.sales.failed +
                snapshot.queues.sales.blocked,
              locale,
            )}
            hint={queueHint(locale, snapshot.queues.sales)}
            hintTone={
              snapshot.queues.sales.failed + snapshot.queues.sales.blocked > 0 ? "down" : "flat"
            }
          />
          <MetricCell
            label={t(locale, "ops.queue.alarms")}
            value={formatNumber(
              snapshot.queues.alarms.pending +
                snapshot.queues.alarms.failed +
                snapshot.queues.alarms.blocked,
              locale,
            )}
            hint={queueHint(locale, snapshot.queues.alarms)}
            hintTone={
              snapshot.queues.alarms.failed + snapshot.queues.alarms.blocked > 0 ? "down" : "flat"
            }
          />
          <MetricCell
            label={t(locale, "ops.queue.reminders")}
            value={formatNumber(
              snapshot.queues.reminders.pending +
                snapshot.queues.reminders.failed +
                snapshot.queues.reminders.blocked,
              locale,
            )}
            hint={queueHint(locale, snapshot.queues.reminders)}
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
          <h2 className="text-lg font-semibold">{t(locale, "ops.lastErrors")}</h2>
          <p className="pd-label">{t(locale, "ops.lastErrorsHint")}</p>
        </div>
        {snapshot.lastErrors.length === 0 ? (
          <p className="py-3 text-sm text-muted">{t(locale, "ops.lastErrors.empty")}</p>
        ) : (
          <ul>
            {snapshot.lastErrors.slice(0, 8).map((item) => (
              <li key={`${item.system}-${item.id}`} className="border-b border-line py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm">{item.headline ?? item.kind}</p>
                  <p className="shrink-0 font-mono text-xs text-faint">{when(item.at, locale)}</p>
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
          <p className="pd-label">{t(locale, "ops.postgres")}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <StatusDot ok={snapshot.health.database === "up"} />
            {snapshot.health.database === "up" ? t(locale, "ops.up") : t(locale, "ops.down")}
          </p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="pd-label">{t(locale, "ops.rita")}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <StatusDot ok={snapshot.health.rita.available} />
            {snapshot.health.rita.available
              ? snapshot.health.rita.modelReady
                ? t(locale, "ops.rita.rulesModel")
                : t(locale, "ops.rita.rulesOnly")
              : t(locale, "ops.rita.missing")}
          </p>
        </div>
        <div className="bg-surface px-4 py-4">
          <p className="pd-label">{t(locale, "ops.connections")}</p>
          <p className="mt-2 text-sm font-medium">
            {snapshot.health.gateway.configured
              ? t(locale, "ops.gateway", { auth: snapshot.health.gateway.auth })
              : t(locale, "ops.gateway.missing")}
            {" · "}
            {t(locale, "ops.sms")}{" "}
            {snapshot.health.sms ? t(locale, "ops.on") : t(locale, "ops.off")}
            {" · "}
            {t(locale, "ops.speech")}{" "}
            {snapshot.health.tts ? t(locale, "ops.on") : t(locale, "ops.off")}
            {" · "}
            {t(locale, "ops.credit")}{" "}
            {snapshot.health.credit ? t(locale, "ops.on") : t(locale, "ops.off")}
            {" · "}
            {t(locale, "ops.webdata")}{" "}
            {snapshot.health.webintel ? t(locale, "ops.on") : t(locale, "ops.off")}
            {" · "}
            {t(locale, "ops.revolut")}{" "}
            {snapshot.health.revolut.configured
              ? snapshot.health.revolut.environment
              : t(locale, "ops.off")}
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
          <h2 className="text-lg font-semibold">{t(locale, "ops.channels")}</h2>
          <p className="pd-label">
            {t(locale, "ops.channels.count", {
              on: snapshot.health.channels.filter((item) => item.configured).length,
              off: snapshot.health.channels.filter((item) => !item.configured).length,
            })}
          </p>
        </div>
        <p className="mt-2 text-xs text-muted">{t(locale, "ops.channels.hint")}</p>
        <ul className="mt-3">
          {snapshot.health.channels.map((channel) => (
            <li
              key={channel.id}
              className="flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <StatusDot ok={channel.configured} />
                  {channel.label}
                  <span className="font-normal text-faint">{channel.vendor}</span>
                </p>
                {channel.note ? <p className="mt-1 text-xs text-muted">{channel.note}</p> : null}
              </div>
              <p className="shrink-0 font-mono text-xs text-faint">{channel.env.join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">{t(locale, "ops.rooms")}</h2>
            <p className="pd-label">{t(locale, "ops.roomEvents")}</p>
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
                    {familyStatusLabel(locale, statusById.get(item.system as never) ?? "pilot")}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatNumber(item.count, locale)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-lg font-semibold">{t(locale, "ops.recent")}</h2>
            <p className="pd-label">{t(locale, "ops.time")}</p>
          </div>
          {snapshot.recent.length === 0 ? (
            <p className="py-3 text-sm text-muted">{t(locale, "ops.recent.empty")}</p>
          ) : (
            <ul>
              {snapshot.recent.map((item) => (
                <li key={item.id} className="border-b border-line py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm">{item.headline ?? item.system}</p>
                    <p className="shrink-0 font-mono text-xs text-faint">{when(item.at, locale)}</p>
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
          {t(locale, "ops.tables")}
        </summary>
        <p className="mt-3 text-sm text-ink-soft">
          {t(locale, "ops.tables.lead", {
            role: snapshot.contract.role,
            pin: snapshot.contract.pin,
          })}
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {snapshot.schemas.map((schema) => (
            <li key={schema.schema} className="flex justify-between gap-3 text-sm">
              <span>{schema.schema}</span>
              <span className="font-mono text-xs text-faint">
                {schema.present
                  ? t(locale, "ops.migrations", { count: schema.migrations.length })
                  : t(locale, "ops.rita.missing")}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t(locale, "ops.tables.caption")}</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pd-label py-2 font-normal">{t(locale, "ops.schema")}</th>
                <th className="pd-label py-2 font-normal">{t(locale, "ops.table")}</th>
                <th className="pd-label py-2 text-right font-normal">{t(locale, "ops.rows")}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.tables.map((table) => (
                <tr key={`${table.schema}.${table.table}`} className="border-b border-line">
                  <td className="py-2 font-mono text-xs text-faint">{table.schema}</td>
                  <td className="py-2">{table.table}</td>
                  <td className="py-2 text-right tabular-nums">
                    {table.rows == null ? "—" : formatNumber(table.rows, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {extra.length > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {t(locale, "ops.extra", {
              list: extra.map((table) => `${table.schema}.${table.table}`).join(", "),
            })}
          </p>
        ) : null}
        {missing.length > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {t(locale, "ops.missing", {
              list: missing.map((table) => `${table.schema}.${table.table}`).join(", "),
            })}
          </p>
        ) : null}
      </details>

      <details className="border border-line bg-surface px-4 py-3">
        <summary className="min-h-11 cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
          {t(locale, "ops.readinessMcp")}
        </summary>
        <p className="mt-3 font-mono text-xs text-faint">
          {t(locale, "ops.mcpLine", {
            requests: snapshot.health.mcp.mcp_requests_total,
            tools: snapshot.health.mcp.mcp_tool_calls_total,
            errors: snapshot.health.mcp.mcp_tool_errors_total,
          })}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {snapshot.readiness.gates.map((gate) => (
            <li key={gate.id} className="border-b border-line py-2">
              <div className="flex justify-between gap-3">
                <p className="text-sm font-medium">{gate.title}</p>
                <p className="pd-label">
                  {gate.state === "ready"
                    ? t(locale, "ops.gate.ready")
                    : gate.state === "blocked"
                      ? t(locale, "ops.gate.blocked")
                      : t(locale, "ops.gate.open")}
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
                {t(locale, "ops.routeTo", {
                  kind: opsSmsKindLabel(locale, route.kind),
                  phone: route.phone || t(locale, "ops.noPhone"),
                })}
              </li>
            ))}
        </ul>
      </details>
    </>
  );
}

function RuntimeMarks({ snapshot, locale }: { snapshot: OpsSnapshot; locale: Locale }) {
  const marks = snapshot.runtimeDebug;
  const flags = [
    marks.hardened ? t(locale, "ops.mark.hardened") : t(locale, "ops.mark.open"),
    marks.seedDemo ? t(locale, "ops.mark.seed") : null,
    marks.cronSet ? t(locale, "ops.mark.cronOn") : t(locale, "ops.mark.cronOff"),
    marks.smsSet ? t(locale, "ops.mark.smsOn") : t(locale, "ops.mark.smsOff"),
    marks.ttsSet ? t(locale, "ops.mark.ttsOn") : t(locale, "ops.mark.ttsOff"),
    marks.sessionSecretSet ? t(locale, "ops.mark.sessionOn") : t(locale, "ops.mark.sessionOff"),
    marks.cookieSecure ? t(locale, "ops.mark.cookieLocked") : t(locale, "ops.mark.cookieOpen"),
  ].filter(Boolean);
  return (
    <p className="text-sm text-muted">
      {t(locale, `runtime.${marks.mark}` as MessageKey)}
      {marks.vercelEnv ? ` · ${marks.vercelEnv}` : ""}
      {marks.appEnv ? ` · ${marks.appEnv}` : ""}
      {" · "}
      {flags.join(" · ")}
    </p>
  );
}

function OpsSearch({ locale }: { locale: Locale }) {
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
      if (!response.ok) throw new Error(t(locale, "ops.searchError"));
      setResult((await response.json()) as OpsDebugLookup);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : t(locale, "ops.searchError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-line bg-surface px-4 py-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-ink-soft">{t(locale, "ops.searchLabel")}</span>
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            minLength={3}
            placeholder={t(locale, "ops.searchPlaceholder")}
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
          {busy ? t(locale, "ops.searching") : t(locale, "ops.search")}
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
                {item.system} · {when(item.at, locale)}
                {item.requestId ? ` · ${item.requestId}` : ""}
              </p>
            </li>
          ))}
          {result.outbox.map((item) => (
            <li key={`outbox-${item.source}-${item.id}`} className="border-b border-line py-3">
              <p className="pd-label">{opsQueueStatus(locale, item.status)}</p>
              <p className="mt-1 text-sm">{item.body}</p>
              {item.lastError ? <p className="mt-1 text-sm text-muted">{item.lastError}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function OpsBoard({
  initial,
  locale = DEFAULT_LOCALE,
}: {
  initial: OpsSnapshot;
  locale?: Locale;
}) {
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
        if (!response.ok) throw new Error(t(locale, "ops.pollError"));
        setSnapshot((await response.json()) as OpsSnapshot);
        setRequestId(response.headers.get("x-request-id"));
        setError(null);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : t(locale, "ops.pollError"));
      }
    };
    const id = window.setInterval(tick, 15_000);
    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, [locale]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="pd-label">
          {snapshot.scope === "house" ? t(locale, "ops.scope.house") : t(locale, "ops.scope.org")} ·{" "}
          {snapshot.runtime}
          {snapshot.hardened ? ` · ${t(locale, "ops.hardened")}` : ""}
        </p>
        <p className="pd-label">{when(snapshot.takenAt, locale)}</p>
      </div>
      <RuntimeMarks snapshot={snapshot} locale={locale} />
      {requestId ? (
        <p className="break-all font-mono text-xs text-faint">
          {t(locale, "ops.lastMeasurement", { id: requestId })}
        </p>
      ) : null}
      {error ? <p className="text-sm text-muted">{error}</p> : null}
      <OpsSearch locale={locale} />
      <OpsView snapshot={snapshot} locale={locale} />
    </div>
  );
}
