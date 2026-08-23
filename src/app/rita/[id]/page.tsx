import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { getAnalysis } from "@/lib/rita/analyses";

export const metadata = {
  title: "Analys — RITA — Pixdrift",
};

export default async function RitaAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const runtime = tryRuntime();
  const analysis =
    session?.org?.ref && runtime ? await getAnalysis(runtime.pool, session.org.ref, id) : null;
  if (session?.org && runtime && !analysis) notFound();

  return (
    <AppShell current="rita" session={session}>
      <p className="pd-label text-faint">
        <Link href="/rita" className="hover:text-ink">
          PIXDRIFT / RITA
        </Link>
      </p>
      {!session?.org ? (
        <SignInGate next="/rita" title="Logga in för att se analysen">
          Analysen tillhör organisationen. Utan session visas den inte.
        </SignInGate>
      ) : analysis ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{analysis.companyName}</h1>
          <p className="font-mono text-sm text-faint">{analysis.orgNumber}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">{analysis.status}</p>
          {analysis.blockedReason ? (
            <Notice>
              Blockerad: {analysis.blockedReason}. Motorn fejkars inte. Koppla{" "}
              <span className="font-mono">RITA_ENGINE_URL</span> för att köra skattjakt.
            </Notice>
          ) : null}
          {analysis.result != null ? (
            <pre className="overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-xs">
              {JSON.stringify(analysis.result, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted">Inget resultatobjekt. Det är avsiktligt när status är blocked.</p>
          )}
          <p className="font-mono text-xs text-faint">{analysis.createdAt}</p>
        </>
      ) : null}
    </AppShell>
  );
}
