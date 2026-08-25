import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { listConnectorSlots } from "@/lib/ekonomi/connectors";
import { railSnapshot } from "@/lib/ekonomi/rails";
import { revolutConfigState } from "@/lib/ekonomi/revolut/config";
import { revolutHealth } from "@/lib/ekonomi/revolut/health";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { saveConnectorAction, syncRevolutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anslutningar — Ekonomi" };

const LABELS = {
  revolut_business: "Revolut Business (kontoutdrag)",
  revolut_merchant: "Revolut Merchant (kundbetalning)",
  stripe: "Stripe restricted/secret key",
  swish: "Swish payee-alias",
} as const;

export default async function AnslutningarPage() {
  const session = await readSession();
  const runtime = tryRuntime();
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
          { href: "/ekonomi/anslutningar", label: "Anslutningar" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Anslutningar</h1>
      <p className="max-w-xl text-ink-soft">
        Revolut ansluter du en gång — sen sköter det sig självt. Övriga tjänster kopplas med en
        nyckel som du klistrar in. Den sparas krypterad och visas aldrig igen (bara de fyra sista
        tecknen).
      </p>
      {!session ? (
        <SignInGate next="/ekonomi/anslutningar" title="Logga in för anslutningar">
          Nycklar tillhör organisationen. De ekas inte tillbaka.
        </SignInGate>
      ) : (
        <>
          <Notice>
            Business-kopplingen läser saldo och transaktioner. Merchant-kopplingen tar betalt av
            kunden. Det är två olika anslutningar.
          </Notice>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">Revolut Business</h2>
              <span className="pd-label text-faint">{revolutConfig.environment}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {revolut?.summary ?? "Statusen kan inte läsas just nu."}
            </p>
            <p className="mt-3">
              <Link
                href="/ekonomi/anslutningar/revolut"
                className="underline decoration-line underline-offset-4"
              >
                {revolut?.actionRequired
                  ? "Anslut om Revolut"
                  : revolut?.oauthConnected
                    ? "Visa anslutningen"
                    : "Anslut Revolut"}
              </Link>
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
          <ul className="flex flex-col gap-3">
            {slots.map((slot) => (
              <li
                key={slot.provider}
                className="rounded-xl border border-line bg-surface px-4 py-4"
              >
                <p className="font-medium">{LABELS[slot.provider]}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Miljövariabel {slot.envKey}
                  {slot.hasSecret ? ` · sparad …${slot.last4 ?? ""}` : " · tom"}
                  {slot.envPresent ? " · finns i process.env" : ""}
                </p>
                <form action={saveConnectorAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="provider" value={slot.provider} />
                  <Field name="secret" label="Klistra in nyckeln (sparas krypterad)" />
                  <Submit>Spara nyckeln</Submit>
                </form>
              </li>
            ))}
          </ul>
          <form
            action={syncRevolutAction}
            className="rounded-xl border border-line bg-surface px-4 py-4"
          >
            <h2 className="text-lg font-semibold">Synka Revolut</h2>
            <p className="mt-2 text-sm text-ink-soft">{rails.revolut.reason}</p>
            <div className="mt-3">
              <Submit>Hämta och matcha</Submit>
            </div>
          </form>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">Revoluts certifikatdialog</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Omdirigerings-URI:n nedan är permanent och är inte Pixdrift-inloggningen.
            </p>
            <p className="mt-3 break-all font-mono text-sm">{revolutConfig.redirect.uri}</p>
            <p className="mt-3 text-sm text-ink-soft">{revolutConfig.redirect.reason}</p>
          </section>
        </>
      )}
    </AppShell>
  );
}
