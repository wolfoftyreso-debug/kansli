import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { listConnectorSlots } from "@/lib/ekonomi/connectors";
import { railSnapshot } from "@/lib/ekonomi/rails";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { saveConnectorAction, syncRevolutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anslutningar — Ekonomi" };

const LABELS = {
  revolut_business: "Revolut Business (matchning, READ)",
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

  return (
    <AppShell current="ekonomi" session={session}>
      <p className="pd-label text-faint">
        <Link href="/ekonomi" className="hover:text-ink">
          Ekonomi
        </Link>
        {" / "}
        Anslutningar
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Nycklar</h1>
      <p className="max-w-xl text-ink-soft">
        Slottar för Revolut och Stripe. Tokenen krypteras med wrap-nyckel och visas aldrig igen —
        bara sista fyra. Du kan också sätta samma namn i miljön.
      </p>
      {!session ? (
        <SignInGate next="/ekonomi/anslutningar" title="Logga in för anslutningar">
          Nycklar tillhör organisationen. De ekas inte tillbaka.
        </SignInGate>
      ) : (
        <>
          <Notice>
            Revolut Business och Merchant är två API:er. Business `GET /transactions` matchar
            inbetalningar. Merchant Orders tar betalt av kunden. Swish Handel kräver bankcertifikat
            — alias räcker inte.
          </Notice>
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
                  <Field name="secret" label="Klistra in token (sparas krypterad)" />
                  <Submit>Spara slot</Submit>
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
        </>
      )}
    </AppShell>
  );
}
