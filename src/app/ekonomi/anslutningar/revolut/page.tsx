import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
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
  refreshing: "Förnyar anslutningen",
  action_required: "Åtgärd krävs",
  revoked: "Inte ansluten",
  error: "Fel i konfigurationen",
};

const CERT_LABEL: Record<RevolutHealth["certificate"]["health"], string> = {
  unknown: "Okänt utgångsdatum",
  valid: "Giltigt",
  expiring: "Går ut snart",
  expired: "Utgånget",
};

const KEY_MATCH_LABEL: Record<RevolutHealth["certificate"]["keyMatch"]["state"], string> = {
  match: "Stämmer med certifikatet",
  mismatch: "Stämmer inte med certifikatet",
  unknown: "Inte kontrollerat",
};

function when(value: string | null): string {
  if (!value) return "aldrig";
  return new Date(value).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

/**
 * The grant can be alive in Revolut while this deployment still cannot sign for
 * it, and calling that "Frisk" would contradict everything else on the page.
 */
function authenticationLabel(health: RevolutHealth): string {
  if (health.certificate.keyMatch.state === "mismatch") return "Nyckeln matchar inte";
  return health.oauthConnected ? "Fungerar" : "Inte ansluten";
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
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/anslutningar", label: "Anslutningar" },
          { href: "/ekonomi/anslutningar/revolut", label: "Revolut" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Revolut Business</h1>
      <p className="max-w-xl text-ink-soft">
        Anslut en gång, sen sköter det sig självt. Du behöver bara logga in i Revolut igen om banken
        stänger anslutningen.
      </p>

      {params.error ? (
        <Notice>{describeCategory(params.error as RevolutErrorCategory)}</Notice>
      ) : null}
      {params.connected ? <Notice>Revolut är ansluten. Förnyelsen sköter sig själv.</Notice> : null}

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
                <Row label="Inloggning mot banken" value={authenticationLabel(health)} />
                <Row
                  label="Automatisk förnyelse"
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
                <Row
                  label="Nyckel och certifikat"
                  value={KEY_MATCH_LABEL[health.certificate.keyMatch.state]}
                />
              </div>
            ) : null}

            {config.keyMatch.state === "mismatch" ? (
              <p className="mt-4 text-sm text-ink-soft">{config.keyMatch.reason}</p>
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
              ) : config.missing.length > 0 ? (
                <span className="text-sm text-ink-soft">
                  Anslut går att trycka på när {config.missing.join(", ")} är satt.
                </span>
              ) : (
                <span className="text-sm text-ink-soft">
                  Anslut går att trycka på när nyckeln och certifikatet hör samman.
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
              Adressen nedan klistrar du in hos Revolut. Den ändras aldrig och hör inte till
              Pixdrift-inloggningen.
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
              Vi tar bort anslutningen här. Vill du stänga dörren helt, ta även bort anslutningen
              inne i Revolut Business (under APIs).
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
