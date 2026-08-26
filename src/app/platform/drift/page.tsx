import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { loadOpsSnapshot, opsScopeFor } from "@/lib/platform/ops";
import { tryRuntime } from "@/lib/platform/page";
import { getRuntime } from "@/lib/platform/runtime";
import { OpsBoard } from "./OpsBoard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Drift — Pixdrift",
  description: "Live mätning av databasen, systemen och den gemensamma strukturen.",
};

export default async function DriftPage() {
  const session = await readSession();
  const orgRef = session?.org?.ref ?? null;
  const scope = opsScopeFor(orgRef);
  const runtime = scope === "house" ? tryRuntime() : tryRuntime(orgRef);
  const snapshot =
    orgRef && runtime
      ? await loadOpsSnapshot(scope === "house" ? getRuntime().pool : runtime.pool, {
          orgRef,
          orgName: session?.org?.name ?? null,
          scope,
        })
      : null;

  return (
    <AppShell current="drift" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb
          crumbs={[
            { href: "/platform", label: "Plattform" },
            { href: "/platform/drift", label: "Drift" },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">Drift</h1>
        <p className="text-ink-soft">
          En bild av hela infrastrukturen. Samma databas. Samma inloggning. Inget visningslager
          ovanpå — det här är mätningen.
        </p>
        <Notice>
          {scope === "house"
            ? "Du är huset. Siffrorna gäller alla bolag. Verkstäder ser bara sitt."
            : "Du ser ert bolag. Inte andras rader, inte husets inkorg."}
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/platform/drift" title="Logga in för drift">
          Driftvyn kräver samma inloggning som resten av Pixdrift.
        </SignInGate>
      ) : !snapshot ? (
        <Notice>Databasen svarar inte. Ingen mätning kan göras.</Notice>
      ) : (
        <>
          <OpsBoard initial={snapshot} />
          <p className="text-sm text-faint">
            <Link href="/kansli/beredskap" className="underline decoration-line underline-offset-4">
              Beredskap
            </Link>
            {" · "}
            <Link href="/platform/events" className="underline decoration-line underline-offset-4">
              Händelser
            </Link>
            {" · "}
            <Link
              href="/api/platform/health"
              className="underline decoration-line underline-offset-4"
            >
              /api/platform/health
            </Link>
            {" · "}
            <Link href="/api/platform/ops" className="underline decoration-line underline-offset-4">
              /api/platform/ops
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
