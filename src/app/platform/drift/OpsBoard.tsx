"use client";

import { useEffect, useState } from "react";
import type { OpsSnapshot } from "@/lib/platform/ops";
import { FAMILY_STATUS_LABEL } from "@/lib/platform/family";
import { SYSTEM_MODULES } from "@pixdrift/systems";

function when(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("sv-SE");
}

function HealthCell({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="border border-line bg-paper px-3 py-3">
      <p className="pd-label">{label}</p>
      <p className={ok ? "mt-2 text-sm font-medium" : "mt-2 text-sm font-medium text-muted"}>
        {value}
      </p>
    </div>
  );
}

function OpsView({ snapshot }: { snapshot: OpsSnapshot }) {
  const statusById = new Map(SYSTEM_MODULES.map((module) => [module.id, module.status]));
  const extra = snapshot.tables.filter((table) => !table.expected);
  const missing = snapshot.tables.filter((table) => table.expected && table.rows === null);

  return (
    <>
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <HealthCell
          label="Postgres"
          value={snapshot.health.database === "up" ? "Svarar" : "Nere"}
          ok={snapshot.health.database === "up"}
        />
        <HealthCell
          label="AI-gateway"
          value={snapshot.health.gateway.configured ? snapshot.health.gateway.auth : "saknas"}
          ok={snapshot.health.gateway.configured}
        />
        <HealthCell
          label="RITA"
          value={
            snapshot.health.rita.available
              ? snapshot.health.rita.modelReady
                ? "regler + AI"
                : "bara regler"
              : "saknas"
          }
          ok={snapshot.health.rita.available}
        />
        <HealthCell
          label="SMS"
          value={snapshot.health.sms ? "kopplad" : "inte kopplad"}
          ok={snapshot.health.sms}
        />
        <HealthCell
          label="Revolut"
          value={
            snapshot.health.revolut.configured
              ? snapshot.health.revolut.environment
              : "inte kopplad"
          }
          ok={snapshot.health.revolut.configured}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Gemensam struktur</h2>
        <p className="text-sm text-ink-soft">
          En Postgres. Rollen {snapshot.contract.role} skriver. Produkter blandar inte tabeller.
          Kundrader bär {snapshot.contract.pin}. Bussen är {snapshot.contract.bus}.
        </p>
        <ul className="flex flex-col gap-2">
          {snapshot.schemas.map((schema) => (
            <li key={schema.schema} className="border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{schema.schema}</p>
                <p className="font-mono text-xs text-faint">
                  {schema.present ? schema.grant : "saknas"}
                  {schema.migrations.length > 0 ? ` · ${schema.migrations.length} migrationer` : ""}
                </p>
              </div>
              {schema.migrations.length > 0 ? (
                <p className="mt-1 font-mono text-xs text-muted">
                  senast {String(schema.migrations.at(-1)?.version).padStart(4, "0")}_
                  {schema.migrations.at(-1)?.name}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Mätning per tabell</h2>
        <p className="text-sm text-ink-soft">
          Siffrorna är live count, inte en uppskattning.{" "}
          {snapshot.scope === "house"
            ? "Huset ser hela flottan."
            : "Verkstaden ser bara sitt bolag."}
        </p>
        <div className="overflow-x-auto border border-line">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Tabeller och rader</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pd-label px-3 py-2 font-normal">Schema</th>
                <th className="pd-label px-3 py-2 font-normal">Tabell</th>
                <th className="pd-label px-3 py-2 font-normal">Tenans</th>
                <th className="pd-label px-3 py-2 text-right font-normal">Rader</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.tables.map((table) => (
                <tr key={`${table.schema}.${table.table}`} className="border-b border-line">
                  <td className="px-3 py-2 font-mono text-xs text-faint">{table.schema}</td>
                  <td className="px-3 py-2">{table.table}</td>
                  <td className="px-3 py-2 text-ink-soft">{table.tenancy}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {table.rows == null ? "—" : table.rows}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {extra.length > 0 ? (
          <p className="text-sm text-muted">
            Extra tabeller som inte står i kontraktet:{" "}
            {extra.map((table) => `${table.schema}.${table.table}`).join(", ")}
          </p>
        ) : null}
        {missing.length > 0 ? (
          <p className="text-sm text-muted">
            Kontraktet saknar tabell i databasen:{" "}
            {missing.map((table) => `${table.schema}.${table.table}`).join(", ")}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Händelser per system</h2>
        <ul className="flex flex-col gap-2">
          {snapshot.events.map((item) => (
            <li
              key={item.system}
              className="flex flex-wrap items-baseline justify-between gap-2 border border-line bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium">{item.system}</p>
                <p className="text-xs text-faint">
                  {FAMILY_STATUS_LABEL[statusById.get(item.system as never) ?? "pilot"] ?? ""}
                </p>
              </div>
              <p className="font-mono text-xs text-faint">
                {item.count} · {when(item.lastAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Identitet</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <HealthCell
            label="Bolag"
            value={
              snapshot.identity.organizations == null
                ? "—"
                : String(snapshot.identity.organizations)
            }
            ok={snapshot.identity.organizations != null}
          />
          <HealthCell
            label="Användare"
            value={snapshot.identity.users == null ? "—" : String(snapshot.identity.users)}
            ok={snapshot.identity.users != null}
          />
          <HealthCell
            label="Medlemskap"
            value={
              snapshot.identity.memberships == null ? "—" : String(snapshot.identity.memberships)
            }
            ok={snapshot.identity.memberships != null}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">MCP i den här processen</h2>
        <p className="text-sm text-ink-soft">
          Räknare i minnet. De nollställs när processen startar om. Det är inte Grafana.
        </p>
        <p className="font-mono text-xs text-faint">
          anrop {snapshot.health.mcp.mcp_requests_total}
          {" · "}
          verktyg {snapshot.health.mcp.mcp_tool_calls_total}
          {" · "}
          fel {snapshot.health.mcp.mcp_tool_errors_total}
          {" · "}
          nekade {snapshot.health.mcp.mcp_authorization_denials_total}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Beredskap</h2>
        <ul className="flex flex-col gap-2">
          {snapshot.readiness.gates.map((gate) => (
            <li key={gate.id} className="border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{gate.title}</p>
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
      </section>
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
        const next = (await response.json()) as OpsSnapshot;
        setSnapshot(next);
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
    <div className="flex flex-col gap-6">
      <p className="pd-label">
        {snapshot.scope === "house" ? "Flotta" : "Bolag"}
        {" · "}
        {snapshot.runtime}
        {snapshot.hardened ? " · härdad" : ""}
        {" · "}
        {when(snapshot.takenAt)}
      </p>
      {error ? <p className="text-sm text-muted">{error}</p> : null}
      <OpsView snapshot={snapshot} />
    </div>
  );
}
