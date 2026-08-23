import { notFound } from "next/navigation";
import { openAgreementByToken } from "@/lib/irma/agreements";
import { tryRuntime } from "@/lib/platform/page";

export const metadata = {
  title: "Avtal — IRMA — Pixdrift",
  description: "Underlag öppnat via IRMA-länk. Inget konto krävs.",
};

export default async function IrmaLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const runtime = tryRuntime();
  if (!runtime) notFound();
  const agreement = await openAgreementByToken({
    pool: runtime.pool,
    events: runtime.events,
    token,
    requestId: crypto.randomUUID(),
  });
  if (!agreement) notFound();

  return (
    <div className="min-h-full bg-paper text-ink">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-16">
        <p className="pd-label text-faint">PIXDRIFT / IRMA</p>
        <h1 className="text-3xl font-semibold tracking-tight">{agreement.title}</h1>
        <p className="text-ink-soft">
          Underlag till <span className="text-ink">{agreement.counterparty}</span>. Inget konto
          krävs. Token hashas — den här URL:en är hemligheten.
        </p>
        <p className="rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-ink-soft">
          Status: <span className="font-medium text-ink">{agreement.status}</span>. Ingen
          e-signatur. Öppning betyder att underlaget är sett, inte att det är underskrivet.
        </p>
        <p className="font-mono text-xs text-faint">{agreement.createdAt}</p>
      </main>
    </div>
  );
}
