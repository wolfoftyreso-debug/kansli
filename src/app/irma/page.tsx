import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { CheckField, EmptyState, Field, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { listAgreements, type Agreement } from "@/lib/irma/agreements";
import { peekIssuedLink, publicIrmaUrl } from "@/lib/irma/issued-link";
import { daysUntilExpiry, effectiveStatus, statusLabel } from "@/lib/irma/status";
import { tryRuntime } from "@/lib/platform/page";
import { CopyIssuedLink } from "./CopyIssuedLink";
import { createIrmaAgreement } from "./actions";

export const metadata = {
  title: "IRMA — Pixdrift",
  description: "Digital avtalshantering. Ett flöde, koll på varje avtal.",
};

function expiryCopy(item: Agreement): string {
  if (item.status === "expired") return "Länken har gått ut. Skicka en ny länk från avtalet.";
  const days = daysUntilExpiry(item.tokenExpiresAt);
  if (days == null) return "Väntar på motparten.";
  if (days <= 0) return "Länken har gått ut. Skicka en ny länk från avtalet.";
  if (days === 1) return "1 dag kvar till länken går ut.";
  return `${days} dagar kvar till länken går ut.`;
}

function needsAttention(item: Agreement): boolean {
  return item.status === "draft" || item.status === "viewed" || item.status === "expired";
}

function AgreementCard({ item }: { item: Agreement }) {
  return (
    <li className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        {statusLabel(item.status)}
      </p>
      <p className="mt-2 text-lg font-medium tracking-tight">
        <Link href={`/irma/${item.id}`} className="hover:underline">
          {item.title}
        </Link>
      </p>
      <p className="mt-1 text-sm text-ink-soft">{item.counterparty}</p>
      {item.status !== "signed" && item.status !== "cancelled" ? (
        <p className="mt-2 text-xs text-muted">{expiryCopy(item)}</p>
      ) : null}
    </li>
  );
}

const STATUS_FILTERS = ["all", "waiting", "signed", "expired", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function parseStatusFilter(value: string | undefined): StatusFilter {
  return STATUS_FILTERS.includes(value as StatusFilter) ? (value as StatusFilter) : "all";
}

function matchesFilter(item: Agreement, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "waiting") return needsAttention(item);
  return effectiveStatus(item) === filter;
}

export default async function IrmaPage({
  searchParams,
}: {
  searchParams: Promise<{ issued?: string; q?: string; status?: string }>;
}) {
  const session = await readSession();
  const runtime = tryRuntime();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = parseStatusFilter(params.status);
  const agreements =
    session?.org?.ref && runtime
      ? await listAgreements(runtime.pool, session.org.ref, query || undefined)
      : [];
  const issued = params.issued === "1" ? await peekIssuedLink() : null;
  const waiting = query || status !== "all" ? [] : agreements.filter(needsAttention);
  const rest =
    query || status !== "all"
      ? agreements.filter((item) => matchesFilter(item, status))
      : agreements.filter((item) => !needsAttention(item));

  return (
    <AppShell current="irma" session={session}>
      <header className="flex flex-col gap-4 pt-4 sm:pt-8">
        <p className="pd-label text-faint">IRMA</p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">Vilket avtal ska ut?</h1>
        <p className="max-w-xl text-ink-soft">
          Med IRMA skickar ni avtal digitalt: skapa, skicka en länk, se när motparten öppnat och
          bekräftat. Motparten behöver inget konto. BankID och dokumentarkiv finns inte än.
        </p>
      </header>

      {issued ? (
        <section className="rounded-md border border-line bg-accent-soft px-3 py-3 text-sm text-ink-soft">
          <p>Länk till motparten — giltig tio minuter i den här webbläsaren. Kopiera den nu.</p>
          <CopyIssuedLink url={publicIrmaUrl(issued)} />
          <a
            href={issued}
            className="mt-2 inline-block font-medium text-ink underline decoration-line underline-offset-4"
          >
            Öppna länken
          </a>
        </section>
      ) : null}

      {!session?.org ? (
        <SignInGate next="/irma" title="Logga in för att skapa avtal">
          Länken visas bara en gång — kopiera den direkt. Vi sparar den inte i läsbar form.
        </SignInGate>
      ) : (
        <>
          {waiting.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-ink-soft">Behöver uppmärksamhet</h2>
              <ul className="flex flex-col gap-3">
                {waiting.map((item) => (
                  <AgreementCard key={item.id} item={item} />
                ))}
              </ul>
            </section>
          ) : null}

          <form action={createIrmaAgreement} className="flex flex-col gap-4">
            <Field name="title" label="Titel" required large />
            <Field name="counterparty" label="Motpart" required large />
            <Field
              name="body"
              label="Vad motparten ska läsa"
              multiline
              large
              placeholder="Valfri text. Klausuler läggs till automatiskt."
            />
            <CheckField
              name="requireAck"
              defaultChecked
              label="Kräv bekräftelse (nivå 1). Avmarkera för rent informationsunderlag."
            />
            <Submit large>Skapa och visa länk</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <p className="flex flex-wrap gap-3 text-sm">
              <Link href="/irma" className="underline decoration-line underline-offset-4">
                Alla
              </Link>
              <Link
                href="/irma?status=waiting"
                className="underline decoration-line underline-offset-4"
              >
                Väntar
              </Link>
              <Link
                href="/irma?status=signed"
                className="underline decoration-line underline-offset-4"
              >
                Bekräftade
              </Link>
              <Link
                href="/irma?status=expired"
                className="underline decoration-line underline-offset-4"
              >
                Utgångna
              </Link>
              <Link
                href="/irma?status=cancelled"
                className="underline decoration-line underline-offset-4"
              >
                Återkallade
              </Link>
            </p>
            <form className="flex gap-2" action="/irma" method="get">
              {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
              <input
                name="q"
                defaultValue={query}
                placeholder="Sök titel eller motpart"
                className="min-h-12 flex-1 rounded-lg border border-line bg-paper px-4 py-3 text-base"
              />
              <button
                type="submit"
                className="min-h-12 rounded-lg border border-line px-4 text-sm text-ink-soft"
              >
                Sök
              </button>
            </form>
            {rest.length === 0 && waiting.length === 0 ? (
              <EmptyState>{query ? "Inget matchade sökningen." : "Inga avtal ännu."}</EmptyState>
            ) : rest.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {rest.map((item) => (
                  <AgreementCard key={item.id} item={item} />
                ))}
              </ul>
            ) : null}
          </section>
        </>
      )}
    </AppShell>
  );
}
