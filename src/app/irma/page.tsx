import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import {
  CheckField,
  EmptyState,
  Field,
  Notice,
  SignInGate,
  Submit,
} from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { listAgreements, type Agreement } from "@/lib/irma/agreements";
import { peekIssuedLink, publicIrmaUrl } from "@/lib/irma/issued-link";
import { statusLabel } from "@/lib/irma/status";
import { tryRuntime } from "@/lib/platform/page";
import { createIrmaAgreement } from "./actions";

export const metadata = {
  title: "IRMA — Pixdrift",
  description: "Avtal och överlämning till personer utanför organisationen.",
};

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
    </li>
  );
}

export default async function IrmaPage({
  searchParams,
}: {
  searchParams: Promise<{ issued?: string; q?: string }>;
}) {
  const session = await readSession();
  const runtime = tryRuntime();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const agreements =
    session?.org?.ref && runtime
      ? await listAgreements(runtime.pool, session.org.ref, query || undefined)
      : [];
  const issued = params.issued === "1" ? await peekIssuedLink() : null;
  const waiting = query ? [] : agreements.filter(needsAttention);
  const rest = query ? agreements : agreements.filter((item) => !needsAttention(item));

  return (
    <AppShell current="irma" session={session}>
      <header className="flex flex-col gap-4 pt-4 sm:pt-8">
        <p className="pd-label text-faint">IRMA</p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">Vad ska motparten läsa?</h1>
        <p className="max-w-xl text-ink-soft">
          Skicka ett underlag. Motparten öppnar länken utan konto. Bekräftelsen är nivå 1 — en
          hashad förklaring, inte BankID.
        </p>
      </header>

      {issued ? (
        <Notice>
          Länk till motparten — giltig två minuter i den här webbläsaren. Kopiera den nu.
          <label className="mt-2 flex flex-col gap-1">
            <span className="sr-only">Länk till motparten</span>
            <input
              readOnly
              value={publicIrmaUrl(issued)}
              className="min-h-11 w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
            />
          </label>
          <a
            href={issued}
            className="mt-2 inline-block font-medium text-ink underline decoration-line underline-offset-4"
          >
            Öppna länken
          </a>
        </Notice>
      ) : null}

      {!session?.org ? (
        <SignInGate next="/irma" title="Logga in för att skapa avtal">
          Länken till motparten visas en gång. I databasen ligger bara en hash.
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
            <form className="flex gap-2" action="/irma" method="get">
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
