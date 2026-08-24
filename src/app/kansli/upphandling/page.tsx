import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { listIntakes } from "@/lib/kansli/intakes";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Upphandlingar — Kansli",
  description: "Inkomna koncernupphandlingar. Demo + möte om 10 dagar.",
};

export default async function KansliUpphandlingPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const intakes = session && runtime ? await listIntakes(runtime.pool) : [];

  return (
    <AppShell current="upphandling" session={session}>
      <p className="pd-label text-faint">
        <Link href="/kansli" className="hover:underline">
          Kansli
        </Link>
        {" · "}
        Upphandling
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Koncernupphandling</h1>
      <p className="max-w-xl text-ink-soft">
        Inkomna underlag. Varje rad används till demo och möte tio dagar senare.
      </p>
      {!session ? (
        <SignInGate next="/kansli/upphandling" title="Logga in för att läsa intagen">
          Det här är kansliets inbox. Offentliga formuläret ligger på /upphandling.
        </SignInGate>
      ) : intakes.length === 0 ? (
        <EmptyState>Inga intag ännu.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {intakes.map((item) => (
            <li key={item.id}>
              <Link
                href={`/kansli/upphandling/${item.id}`}
                className="block rounded-xl border border-line bg-surface px-4 py-4 hover:border-line-strong"
              >
                <p className="font-medium">{item.companyName}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {item.contactName} · {item.contactEmail}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  Möte {formatSwedishDateTime(item.meetingAt)}
                  {item.invoiceNumber ? ` · ${item.invoiceNumber}` : ""}
                  {item.provisionedEmail ? " · konto skapat" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
