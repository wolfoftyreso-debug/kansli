import { AppShell } from "@/components/app/AppShell";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { authConfig } from "@/lib/auth/config";
import { readSession } from "@/lib/auth/session";
import { listAgreements } from "@/lib/irma/agreements";
import { tryRuntime } from "@/lib/platform/page";
import { createIrmaAgreement } from "./actions";

export const metadata = {
  title: "IRMA — Pixdrift",
  description: "Avtal och överlämning till personer utanför organisationen.",
};

export default async function IrmaPage({
  searchParams,
}: {
  searchParams: Promise<{ issued?: string; link?: string }>;
}) {
  const session = await readSession();
  const runtime = tryRuntime();
  const agreements =
    session?.org?.ref && runtime ? await listAgreements(runtime.pool, session.org.ref) : [];
  const params = await searchParams;

  return (
    <AppShell current="irma" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / IRMA</p>
        <h1 className="text-3xl font-semibold tracking-tight">IRMA</h1>
        <p className="text-ink-soft">
          Avtal, klausuler och en engångslänk till motparten. Token hashas; klartext visas bara när
          avtalet skapas. Motparten kan bekräfta med en hashad förklaring — inte BankID.
        </p>
        <Notice>
          Ingen kvalificerad e-signatur och ingen fillagring. Artefakten är SHA-256 av det
          bekräftade underlaget.
        </Notice>
      </header>

      {params.issued && params.link ? (
        <Notice>
          Länk till motparten (visas en gång):{" "}
          <a
            href={params.link}
            className="break-all font-mono text-ink underline decoration-line underline-offset-4"
          >
            {params.link.startsWith("http") ? params.link : `${authConfig.baseUrl}${params.link}`}
          </a>
        </Notice>
      ) : null}

      {!session?.org ? (
        <SignInGate next="/irma" title="Logga in för att skapa avtal">
          Länken till motparten returneras en gång. I databasen ligger bara hash.
        </SignInGate>
      ) : (
        <>
          <form action={createIrmaAgreement} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Nytt avtal</h2>
            <Field name="title" label="Titel" required />
            <Field name="counterparty" label="Motpart" required />
            <Submit>Skapa och visa länk</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Avtal</h2>
            {agreements.length === 0 ? (
              <EmptyState>Inga avtal ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {agreements.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {item.status}
                    </p>
                    <p className="mt-2 font-medium">{item.title}</p>
                    <p className="text-sm text-ink-soft">{item.counterparty}</p>
                    {item.artifactSha256 ? (
                      <p className="mt-2 break-all font-mono text-xs text-faint">
                        artefakt {item.artifactSha256}
                      </p>
                    ) : null}
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
