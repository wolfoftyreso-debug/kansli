import Link from "next/link";
import { GatewayPing } from "./GatewayPing";
import { AppShell } from "@/components/app/AppShell";
import { Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { gatewaySnapshot } from "@/lib/platform/ai";
import {
  FAMILY_BLOCKED,
  FAMILY_LINKS,
  FAMILY_PRINCIPLE,
  FAMILY_SYSTEMS,
} from "@/lib/platform/family";

export const metadata = {
  title: "Plattform — Pixdrift",
  description: "Vad varje system gör, och hur de hänger ihop.",
};

const PATH: Record<string, string> = {
  identity: "/idp",
  kansli: "/kansli",
  tora: "/tora",
  rita: "/rita",
  britt: "/britt",
  irma: "/irma",
  alva: "/alva",
};

export default async function PlatformPage() {
  const session = await readSession();
  const gateway = gatewaySnapshot();

  return (
    <AppShell current="platform" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / Plattform</p>
        <h1 className="text-3xl font-semibold tracking-tight">Vad varje system gör</h1>
        <p className="text-ink-soft">{FAMILY_PRINCIPLE}</p>
        <Notice>
          En process. En Postgres. Append-only <span className="font-mono">platform.events</span>.
          Ingen produkt skriver i en annans schema.
        </Notice>
      </header>

      <section className="rounded-xl border border-line bg-surface px-4 py-4">
        <h2 className="text-lg font-semibold">Vercel AI Gateway</h2>
        <p className="mt-2 text-sm text-ink-soft">
          En credential, OpenAI-kompatibel yta mot 100+ modeller. Produkter går via{" "}
          <span className="font-mono">@pixdrift/ai-core</span>. Svaret är inferens, inte fakta.
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

      <section className="flex flex-col gap-3">
        {FAMILY_SYSTEMS.map((system) => (
          <article key={system.id} className="rounded-xl border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">
                <Link href={PATH[system.id] ?? "/platform"} className="hover:underline">
                  {system.name}
                </Link>
              </h2>
              <p className="font-mono text-xs text-faint">{system.status}</p>
            </div>
            <p className="mt-2 text-sm font-medium text-ink">{system.question}</p>
            <p className="mt-2 text-sm text-ink-soft">{system.does}</p>
            <p className="mt-2 text-sm text-muted">{system.doesNot}</p>
            <p className="mt-3 font-mono text-xs text-faint">äger {system.owns}</p>
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
              <p className="font-mono text-xs text-accent">{link.via}</p>
              <p className="mt-1 text-sm font-medium">
                {link.from} → {link.to}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{link.meaning}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Väntar på underlag utanför det här repot</h2>
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

      <p className="text-sm text-faint">
        <Link href="/api/platform/health" className="underline decoration-line underline-offset-4">
          /api/platform/health
        </Link>
        {" · "}
        <Link href="/api/platform/ai" className="underline decoration-line underline-offset-4">
          /api/platform/ai
        </Link>
        {" · "}
        <Link href="/platform/events" className="underline decoration-line underline-offset-4">
          Händelser
        </Link>
      </p>
    </AppShell>
  );
}
