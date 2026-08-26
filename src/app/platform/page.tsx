import Link from "next/link";
import { GatewayPing } from "./GatewayPing";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { gatewaySnapshot } from "@/lib/platform/ai";
import {
  FAMILY_BLOCKED,
  FAMILY_INCOMING,
  FAMILY_LINKS,
  FAMILY_PRINCIPLE,
  FAMILY_STACK,
  FAMILY_STATUS_LABEL,
  FAMILY_SYSTEMS,
  familyPartyName,
} from "@/lib/platform/family";
import { hubStatus, ritaStatusLine } from "@/lib/platform/hub-status";

export const metadata = {
  title: "Plattform — Pixdrift",
  description: "Vad varje system gör, och hur de hänger ihop.",
};

const PATH: Record<string, string> = {
  identity: "/idp",
  kansli: "/kansli",
  ekonomi: "/ekonomi",
  tora: "/tora",
  rita: "/rita",
  britt: "/britt",
  irma: "/irma",
  tyra: "/tyra",
  alva: "/alva",
  creditae: "/creditae",
};

export default async function PlatformPage() {
  const session = await readSession();
  const gateway = gatewaySnapshot();
  const status = hubStatus();

  return (
    <AppShell current="platform" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/platform", label: "Plattform" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Vad varje system gör</h1>
        <p className="text-ink-soft">{FAMILY_PRINCIPLE}</p>
        <Notice>
          Varje system gör ett jobb. TORA tar upphandlingar. RITA tar skatt. De blandas inte.
        </Notice>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Systemen</h2>
        {FAMILY_SYSTEMS.map((system) => (
          <article key={system.id} className="rounded-xl border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">
                <Link href={PATH[system.id] ?? "/platform"} className="hover:underline">
                  {system.name}
                </Link>
              </h3>
              <p className="text-xs text-faint">{FAMILY_STATUS_LABEL[system.status]}</p>
            </div>
            <p className="mt-2 text-sm font-medium text-ink">{system.mission}</p>
            <p className="mt-1 text-sm text-ink-soft">{system.does}</p>
            <p className="mt-2 text-sm text-muted">{system.doesNot}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Hur de hänger ihop</h2>
        <ul className="flex flex-col gap-2">
          {FAMILY_LINKS.map((link) => (
            <li
              key={`${link.from}-${link.via}`}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            >
              <p className="text-sm font-medium">
                {familyPartyName(link.from)} → {familyPartyName(link.to)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{link.meaning}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Fler system</h2>
        <p className="text-sm text-ink-soft">{FAMILY_INCOMING}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Väntar på att kopplas in</h2>
        <ul className="flex flex-col gap-2">
          {FAMILY_BLOCKED.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft"
            >
              {item.need}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Teknik — för den som sköter driften</h2>
        <p className="font-mono text-xs text-faint">
          Postgres {status.database}
          {" · "}
          Gateway {status.gateway.configured ? status.gateway.auth : "saknas"}
          {" · "}
          {ritaStatusLine(status.rita)}
        </p>
        <ul className="flex flex-col gap-2">
          {FAMILY_STACK.map((row) => (
            <li key={row.layer} className="rounded-xl border border-line bg-surface px-4 py-3">
              <p className="font-mono text-xs text-accent">{row.layer}</p>
              <p className="mt-1 text-sm text-ink-soft">{row.runs}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-surface px-4 py-4">
        <h2 className="text-lg font-semibold">Modellgateway</h2>
        <p className="mt-2 text-sm text-ink-soft">
          En nyckel ger tillgång till över 100 modeller. Kom ihåg: systemets svar är gissningar,
          inte fakta.
        </p>
        <p className="mt-3 font-mono text-xs text-faint">
          {gateway.configured ? `konfigurerad · ${gateway.auth}` : "saknar nyckel"} ·{" "}
          {gateway.model}
        </p>
        {session?.org && gateway.configured ? (
          <div className="mt-3">
            <GatewayPing />
          </div>
        ) : null}
        {!gateway.configured ? (
          <p className="mt-3 text-sm text-muted">
            Sätt <span className="font-mono">AI_GATEWAY_API_KEY</span> i Secrets eller{" "}
            <span className="font-mono">VERCEL_OIDC_TOKEN</span> på Vercel.
          </p>
        ) : null}
      </section>

      <p className="text-sm text-faint">
        <Link href="/api/platform/health" className="underline decoration-line underline-offset-4">
          /api/platform/health
        </Link>
        {" · "}
        <Link href="/api/platform/ai" className="underline decoration-line underline-offset-4">
          /api/platform/ai
        </Link>
        {" · "}
        <Link href="/platform/drift" className="underline decoration-line underline-offset-4">
          Drift
        </Link>
        {" · "}
        <Link href="/platform/events" className="underline decoration-line underline-offset-4">
          Händelser
        </Link>
        {" · "}
        <Link href="/platform/mcp" className="underline decoration-line underline-offset-4">
          MCP
        </Link>
        {" · "}
        <Link href="/api/mcp/health" className="underline decoration-line underline-offset-4">
          /api/mcp/health
        </Link>
      </p>
    </AppShell>
  );
}
