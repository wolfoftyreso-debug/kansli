import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { REVOLUT_CONNECT_PATH, revolutConfigState } from "@/lib/ekonomi/revolut/config";
import { describeCategory, type RevolutErrorCategory } from "@/lib/ekonomi/revolut/errors";
import { revolutHealth, type RevolutHealth } from "@/lib/ekonomi/revolut/health";
import { disconnectRevolutAction } from "../../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Revolut Business — Ekonomi" };

const STATUS_LABEL: Record<RevolutHealth["status"], string> = {
  not_configured: "Inte konfigurerad",
  pending_authorization: "Väntar på godkännande",
  active: "Ansluten",
  refreshing: "Förnyar token",
  action_required: "Åtgärd krävs",
  revoked: "Inte ansluten",
  error: "Fel",
};

const CERT_LABEL: Record<RevolutHealth["certificate"]["health"], string> = {
  unknown: "Okänt utgångsdatum",
  valid: "Giltigt",
  expiring: "Går ut snart",
  expired: "Utgånget",
};

function when(value: string | null): string {
  if (!value) return "aldrig";
  return new Date(value).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line py-2 first:border-t-0">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function RevolutConnectionPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = await readSession();
  const params = await searchParams;
  const config = revolutConfigState();
  const runtime = tryRuntime();
  const health =
    session?.org?.ref && runtime ? await revolutHealth(runtime.pool, session.org.ref) : null;

  return (
    <AppShell current="ekonomi" session={session}>
      <p className="pd-label text-faint">
        <Link href="/ekonomi/anslutningar" className="hover:text-ink">
          Anslutningar
        </Link>
        {" / "}
        Revolut
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Revolut Business</h1>
      <p className="max-w-xl text-ink-soft">
        En anslutning, en gång. Access-tokenen lever 40 minuter och förnyas automatiskt. Du behöver
        bara logga in i Revolut igen om Revolut drar tillbaka behörigheten.
      </p>

      {params.error ? (
        <Notice>{describeCategory(params.error as RevolutErrorCategory)}</Notice>
      ) : null}
      {params.connected ? <Notice>Revolut är ansluten. Tokenen sköts härifrån.</Notice> : null}

      {!session ? (
        <SignInGate next="/ekonomi/anslutningar/revolut" title="Logga in för att ansluta Revolut">
          Bankanslutningen tillhör organisationen.
        </SignInGate>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                {health ? STATUS_LABEL[health.status] : "Okänd status"}
              </h2>
              <span className="pd-label text-faint">{config.environment}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {health?.summary ?? "Databasen svarar inte, så statusen kan inte läsas."}
            </p>

            {health ? (
              <div className="mt-4">
                <Row
                  label="Autentisering"
                  value={health.oauthConnected ? "Frisk" : "Inte ansluten"}
                />
                <Row
                  label="Automatisk tokenförnyelse"
                  value={health.automaticRenewal ? "Aktiv" : "Inaktiv"}
                />
                <Row label="Senast verifierad" value={when(health.lastSuccessAt)} />
                <Row label="Senaste förnyelse" value={when(health.lastRefreshAt)} />
                <Row label="Ansluten sedan" value={when(health.connectedAt)} />
                <Row
                  label="Certifikat"
                  value={
                    health.certificate.daysUntilExpiry === null
                      ? CERT_LABEL[health.certificate.health]
                      : `${CERT_LABEL[health.certificate.health]} · ${health.certificate.daysUntilExpiry} dagar`
                  }
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {config.ready ? (
                <Link
                  href={REVOLUT_CONNECT_PATH}
                  prefetch={false}
                  className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-2"
                >
                  {health?.oauthConnected || health?.actionRequired
                    ? "Anslut om Revolut"
                    : "Anslut Revolut"}
                </Link>
              ) : (
                <span className="text-sm text-ink-soft">
                  Anslut går att trycka på när {config.missing.join(", ")} är satt.
                </span>
              )}
              {health && health.status !== "not_configured" && health.status !== "revoked" ? (
                <form action={disconnectRevolutAction}>
                  <Submit>Koppla bort</Submit>
                </form>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">Det här klistrar du in i Revolut</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Omdirigerings-URI. Den är permanent och hör inte till Pixdrift-inloggningen.
            </p>
            <p className="mt-2 break-all font-mono text-sm">{config.redirect.uri}</p>
            <p className="mt-3 text-sm text-ink-soft">{config.redirect.reason}</p>
            <p className="mt-3 text-sm text-ink-soft">
              JWT iss: <span className="font-mono">{config.jwtIssuer}</span>
              {config.certificate.fingerprint ? (
                <>
                  {" · certifikatets fingeravtryck: "}
                  <span className="font-mono">{config.certificate.fingerprint}</span>
                </>
              ) : null}
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">Om du kopplar bort</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Vi raderar tokenarna här. Revolut har inget publikt API för att återkalla dem, så ta
              även bort appens behörighet under APIs i Revolut Business om du vill stänga dörren
              helt.
            </p>
          </section>

          <p>
            <Link
              href="/ekonomi/kontoutdrag"
              className="underline decoration-line underline-offset-4"
            >
              Öppna kontoutdrag
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
