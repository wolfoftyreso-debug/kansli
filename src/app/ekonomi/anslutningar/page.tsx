import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { listConnectorSlots } from "@/lib/ekonomi/connectors";
import { railSnapshot } from "@/lib/ekonomi/rails";
import { revolutConfigState } from "@/lib/ekonomi/revolut/config";
import { revolutHealth } from "@/lib/ekonomi/revolut/health";
import { readSession } from "@/lib/auth/session";
import { ekonomiConnSlot, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { saveConnectorAction, syncRevolutAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.conn.metaTitle"),
    description: t(locale, "ekonomi.conn.metaDescription"),
  };
}

export default async function AnslutningarPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const slots =
    session?.org?.ref && runtime ? await listConnectorSlots(runtime.pool, session.org.ref) : [];
  const rails = railSnapshot();
  const revolutConfig = revolutConfigState();
  const revolut =
    session?.org?.ref && runtime ? await revolutHealth(runtime.pool, session.org.ref) : null;

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/anslutningar", label: t(locale, "ekonomi.connections") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "ekonomi.conn.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "ekonomi.conn.lead")}</p>
      {!session ? (
        <SignInGate
          next="/ekonomi/anslutningar"
          title={t(locale, "ekonomi.conn.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.conn.signInBody")}
        </SignInGate>
      ) : (
        <>
          <Notice>{t(locale, "ekonomi.conn.notice")}</Notice>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{t(locale, "ekonomi.conn.revolutBusiness")}</h2>
              <span className="pd-label text-faint">{revolutConfig.environment}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {revolut?.summary ?? t(locale, "ekonomi.conn.statusUnknown")}
            </p>
            <p className="mt-3">
              <Link
                href="/ekonomi/anslutningar/revolut"
                className="underline decoration-line underline-offset-4"
              >
                {revolut?.actionRequired
                  ? t(locale, "ekonomi.stmt.reconnect")
                  : revolut?.oauthConnected
                    ? t(locale, "ekonomi.conn.show")
                    : t(locale, "ekonomi.stmt.connect")}
              </Link>
            </p>
          </section>
          <p>
            <Link
              href="/ekonomi/kontoutdrag"
              className="underline decoration-line underline-offset-4"
            >
              {t(locale, "ekonomi.conn.openStatements")}
            </Link>
          </p>
          <ul className="flex flex-col gap-3">
            {slots.map((slot) => (
              <li
                key={slot.provider}
                className="rounded-xl border border-line bg-surface px-4 py-4"
              >
                <p className="font-medium">{ekonomiConnSlot(locale, slot.provider)}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {t(locale, "ekonomi.conn.env", { key: slot.envKey })}
                  {slot.hasSecret
                    ? ` · ${t(locale, "ekonomi.conn.saved", { last4: slot.last4 ?? "" })}`
                    : ` · ${t(locale, "ekonomi.conn.empty")}`}
                  {slot.envPresent ? ` · ${t(locale, "ekonomi.conn.inEnv")}` : ""}
                </p>
                <form action={saveConnectorAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="provider" value={slot.provider} />
                  <Field name="secret" label={t(locale, "ekonomi.conn.paste")} />
                  <Submit>{t(locale, "ekonomi.conn.saveKey")}</Submit>
                </form>
              </li>
            ))}
          </ul>
          <form
            action={syncRevolutAction}
            className="rounded-xl border border-line bg-surface px-4 py-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.conn.sync")}</h2>
            <p className="mt-2 text-sm text-ink-soft">{rails.revolut.reason}</p>
            <div className="mt-3">
              <Submit>{t(locale, "ekonomi.conn.fetchMatch")}</Submit>
            </div>
          </form>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.conn.cert")}</h2>
            <p className="mt-2 text-sm text-ink-soft">{t(locale, "ekonomi.conn.certLead")}</p>
            <p className="mt-3 break-all font-mono text-sm">{revolutConfig.redirect.uri}</p>
            <p className="mt-3 text-sm text-ink-soft">{revolutConfig.redirect.reason}</p>
          </section>
        </>
      )}
    </AppShell>
  );
}
