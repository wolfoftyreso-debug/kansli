import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import {
  ekonomiRevolutCert,
  ekonomiRevolutError,
  ekonomiRevolutKey,
  ekonomiRevolutStatus,
  t,
  type Locale,
} from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { REVOLUT_CONNECT_PATH, revolutConfigState } from "@/lib/ekonomi/revolut/config";
import { type RevolutErrorCategory } from "@/lib/ekonomi/revolut/errors";
import { revolutHealth, type RevolutHealth } from "@/lib/ekonomi/revolut/health";
import { disconnectRevolutAction } from "../../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.rev.metaTitle"),
    description: t(locale, "ekonomi.rev.metaDescription"),
  };
}

function when(value: string | null, locale: Locale): string {
  if (!value) return t(locale, "ekonomi.rev.never");
  return formatDateTime(value, locale);
}

/**
 * The grant can be alive in Revolut while this deployment still cannot sign for
 * it, and calling that "Working" would contradict everything else on the page.
 */
function authenticationLabel(locale: Locale, health: RevolutHealth): string {
  if (health.certificate.keyMatch.state === "mismatch") {
    return t(locale, "ekonomi.rev.authMismatch");
  }
  return health.oauthConnected ? t(locale, "ekonomi.rev.authOk") : t(locale, "ekonomi.rev.authOff");
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
  const locale = await readLocale();
  const params = await searchParams;
  const config = revolutConfigState();
  const runtime = tryRuntime(session?.org?.ref);
  const health =
    session?.org?.ref && runtime ? await revolutHealth(runtime.pool, session.org.ref) : null;

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/anslutningar", label: t(locale, "ekonomi.connections") },
          { href: "/ekonomi/anslutningar/revolut", label: "Revolut" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "ekonomi.rev.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "ekonomi.rev.lead")}</p>

      {params.error ? (
        <Notice>{ekonomiRevolutError(locale, params.error as RevolutErrorCategory)}</Notice>
      ) : null}
      {params.connected ? <Notice>{t(locale, "ekonomi.rev.connected")}</Notice> : null}

      {!session ? (
        <SignInGate
          next="/ekonomi/anslutningar/revolut"
          title={t(locale, "ekonomi.rev.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.rev.signInBody")}
        </SignInGate>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                {health
                  ? ekonomiRevolutStatus(locale, health.status)
                  : t(locale, "ekonomi.rev.statusUnknown")}
              </h2>
              <span className="pd-label text-faint">{config.environment}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {health?.summary ?? t(locale, "ekonomi.rev.noDb")}
            </p>

            {health ? (
              <div className="mt-4">
                <Row
                  label={t(locale, "ekonomi.rev.auth")}
                  value={authenticationLabel(locale, health)}
                />
                <Row
                  label={t(locale, "ekonomi.rev.renewal")}
                  value={
                    health.automaticRenewal
                      ? t(locale, "ekonomi.rev.active")
                      : t(locale, "ekonomi.rev.inactive")
                  }
                />
                <Row
                  label={t(locale, "ekonomi.rev.lastVerified")}
                  value={when(health.lastSuccessAt, locale)}
                />
                <Row
                  label={t(locale, "ekonomi.rev.lastRenewal")}
                  value={when(health.lastRefreshAt, locale)}
                />
                <Row
                  label={t(locale, "ekonomi.rev.connectedSince")}
                  value={when(health.connectedAt, locale)}
                />
                <Row
                  label={t(locale, "ekonomi.rev.cert")}
                  value={
                    health.certificate.daysUntilExpiry === null
                      ? ekonomiRevolutCert(locale, health.certificate.health)
                      : t(locale, "ekonomi.rev.certDays", {
                          label: ekonomiRevolutCert(locale, health.certificate.health),
                          days: health.certificate.daysUntilExpiry,
                        })
                  }
                />
                <Row
                  label={t(locale, "ekonomi.rev.keyAndCert")}
                  value={ekonomiRevolutKey(locale, health.certificate.keyMatch.state)}
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
                    ? t(locale, "ekonomi.stmt.reconnect")
                    : t(locale, "ekonomi.stmt.connect")}
                </Link>
              ) : config.missing.length > 0 ? (
                <span className="text-sm text-ink-soft">
                  {t(locale, "ekonomi.rev.connectWhenEnv", { keys: config.missing.join(", ") })}
                </span>
              ) : (
                <span className="text-sm text-ink-soft">
                  {t(locale, "ekonomi.rev.connectWhenMatch")}
                </span>
              )}
              {health && health.status !== "not_configured" && health.status !== "revoked" ? (
                <form action={disconnectRevolutAction}>
                  <Submit>{t(locale, "ekonomi.rev.disconnect")}</Submit>
                </form>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.rev.pasteHeading")}</h2>
            <p className="mt-2 text-sm text-ink-soft">{t(locale, "ekonomi.rev.pasteLead")}</p>
            <p className="mt-2 break-all font-mono text-sm">{config.redirect.uri}</p>
            <p className="mt-3 text-sm text-ink-soft">{config.redirect.reason}</p>
            <p className="mt-3 text-sm text-ink-soft">
              {t(locale, "ekonomi.rev.jwtIss")}{" "}
              <span className="font-mono">{config.jwtIssuer}</span>
              {config.certificate.fingerprint ? (
                <>
                  {" · "}
                  {t(locale, "ekonomi.rev.fingerprint")}{" "}
                  <span className="font-mono">{config.certificate.fingerprint}</span>
                </>
              ) : null}
            </p>
          </section>

          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.rev.disconnectHeading")}</h2>
            <p className="mt-2 text-sm text-ink-soft">{t(locale, "ekonomi.rev.disconnectLead")}</p>
          </section>

          <p>
            <Link
              href="/ekonomi/kontoutdrag"
              className="underline decoration-line underline-offset-4"
            >
              {t(locale, "ekonomi.conn.openStatements")}
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
