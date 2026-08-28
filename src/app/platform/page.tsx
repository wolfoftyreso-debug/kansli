import Link from "next/link";
import { GatewayPing } from "./GatewayPing";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import {
  familyBlockedNeed,
  familyField,
  familyLinkMeaning,
  familyMission,
  familyPartyLabel,
  familyStackLine,
  familyStatusLabel,
  t,
} from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { gatewaySnapshot } from "@/lib/platform/ai";
import { FAMILY_BLOCKED, FAMILY_LINKS, FAMILY_STACK, FAMILY_SYSTEMS } from "@/lib/platform/family";
import { hubStatus, ritaStatusLine } from "@/lib/platform/hub-status";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "platform.metaTitle"),
    description: t(locale, "platform.metaDescription"),
  };
}

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
  const locale = await readLocale();
  const gateway = gatewaySnapshot();
  const status = hubStatus();

  return (
    <AppShell current="platform" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/platform", label: t(locale, "service.platform") }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "platform.heading")}</h1>
        <p className="text-ink-soft">{t(locale, "family.principle")}</p>
        <Notice>{t(locale, "platform.notice")}</Notice>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t(locale, "platform.systems")}</h2>
        {FAMILY_SYSTEMS.map((system) => (
          <article key={system.id} className="rounded-xl border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">
                <Link href={PATH[system.id] ?? "/platform"} className="hover:underline">
                  {system.name}
                </Link>
              </h3>
              <p className="text-xs text-faint">{familyStatusLabel(locale, system.status)}</p>
            </div>
            <p className="mt-2 text-sm font-medium text-ink">{familyMission(locale, system.id)}</p>
            <p className="mt-1 text-sm text-ink-soft">{familyField(locale, system.id, "does")}</p>
            <p className="mt-2 text-sm text-muted">{familyField(locale, system.id, "doesNot")}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t(locale, "platform.howTheyConnect")}</h2>
        <ul className="flex flex-col gap-2">
          {FAMILY_LINKS.map((link) => (
            <li
              key={`${link.from}-${link.via}`}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            >
              <p className="text-sm font-medium">
                {familyPartyLabel(locale, link.from)} → {familyPartyLabel(locale, link.to)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{familyLinkMeaning(locale, link.id)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t(locale, "platform.moreSystems")}</h2>
        <p className="text-sm text-ink-soft">{t(locale, "family.incoming")}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t(locale, "platform.waiting")}</h2>
        <ul className="flex flex-col gap-2">
          {FAMILY_BLOCKED.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft"
            >
              {familyBlockedNeed(locale, item.id)}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t(locale, "platform.tech")}</h2>
        <p className="font-mono text-xs text-faint">
          Postgres {status.database}
          {" · "}
          Gateway {status.gateway.configured ? status.gateway.auth : t(locale, "common.missing")}
          {" · "}
          {ritaStatusLine(status.rita)}
        </p>
        <ul className="flex flex-col gap-2">
          {FAMILY_STACK.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-surface px-4 py-3">
              <p className="font-mono text-xs text-accent">
                {familyStackLine(locale, row.id, "layer")}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {familyStackLine(locale, row.id, "runs")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-surface px-4 py-4">
        <h2 className="text-lg font-semibold">{t(locale, "platform.gateway")}</h2>
        <p className="mt-2 text-sm text-ink-soft">{t(locale, "platform.gatewayLead")}</p>
        <p className="mt-3 font-mono text-xs text-faint">
          {gateway.configured
            ? t(locale, "common.configured", { auth: gateway.auth })
            : t(locale, "common.missingKey")}{" "}
          · {gateway.model}
        </p>
        {session?.org && gateway.configured ? (
          <div className="mt-3">
            <GatewayPing locale={locale} />
          </div>
        ) : null}
        {!gateway.configured ? (
          <p className="mt-3 text-sm text-muted">
            {t(locale, "platform.gatewayHint", {
              key: "AI_GATEWAY_API_KEY",
              oidc: "VERCEL_OIDC_TOKEN",
            })}
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
          {t(locale, "service.ops")}
        </Link>
        {" · "}
        <Link href="/platform/events" className="underline decoration-line underline-offset-4">
          {t(locale, "service.events")}
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
