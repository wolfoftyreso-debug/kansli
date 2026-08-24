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
import { listAgreements } from "@/lib/irma/agreements";
import { peekIssuedLink, publicIrmaUrl } from "@/lib/irma/issued-link";
import { statusLabel } from "@/lib/irma/status";
import { tryRuntime } from "@/lib/platform/page";
import { createIrmaAgreement } from "./actions";

export const metadata = {
  title: "IRMA — Pixdrift",
  description: "Avtal och överlämning till personer utanför organisationen.",
};

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

  return (
    <AppShell current="irma" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / IRMA</p>
        <h1 className="text-3xl font-semibold tracking-tight">IRMA</h1>
        <p className="text-ink-soft">
          Skicka ett underlag till någon utanför organisationen. Motparten öppnar länken utan konto
          och kan bekräfta att hen har läst det.
        </p>
        <Notice>
          Bekräftelsen är nivå 1: en hashad förklaring. Inte BankID. Inte kvalificerad e-signatur.
          Ingen fillagring.
        </Notice>
      </header>

      {issued ? (
        <Notice>
          Länk till motparten — giltig två minuter i den här webbläsaren. Kopiera den nu.
          <label className="mt-2 flex flex-col gap-1">
            <span className="sr-only">Länk till motparten</span>
            <input
              readOnly
              value={publicIrmaUrl(issued)}
              className="w-full min-h-11 rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
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
          <form
            action={createIrmaAgreement}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Nytt underlag</h2>
            <Field name="title" label="Titel" required />
            <Field name="counterparty" label="Motpart" required />
            <Field
              name="body"
              label="Vad motparten ska läsa"
              multiline
              placeholder="Valfri text. Klausuler läggs till automatiskt."
            />
            <CheckField
              name="requireAck"
              defaultChecked
              label="Kräv bekräftelse (nivå 1). Avmarkera för rent informationsunderlag."
            />
            <Submit>Skapa och visa länk</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Avtal</h2>
            <form className="flex gap-2" action="/irma" method="get">
              <input
                name="q"
                defaultValue={query}
                placeholder="Sök titel eller motpart"
                className="min-h-11 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-base"
              />
              <button
                type="submit"
                className="rounded-md border border-line px-3 text-sm text-ink-soft"
              >
                Sök
              </button>
            </form>
            {agreements.length === 0 ? (
              <EmptyState>
                {query ? "Inget matchade sökningen." : "Inga avtal ännu."}
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {agreements.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {statusLabel(item.status)}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/irma/${item.id}`} className="hover:underline">
                        {item.title}
                      </Link>
                    </p>
                    <p className="text-sm text-ink-soft">{item.counterparty}</p>
                    <p className="mt-2 font-mono text-xs text-faint">{item.createdAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
