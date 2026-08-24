import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { revolutOAuthRedirectUri, revolutRedirectStatus } from "@/lib/ekonomi/revolut-oauth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revolut OAuth — Ekonomi",
};

export default async function RevolutOAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const session = await readSession();
  const params = await searchParams;
  const code = params.code?.trim() || null;
  const error = params.error?.trim() || null;
  const errorDescription = params.error_description?.trim() || null;
  const status = revolutRedirectStatus();
  const registered = revolutOAuthRedirectUri();

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
        Det här är Revoluts OAuth-callback. Den är inte Pixdrift-inloggningen.
      </p>

      <section className="rounded-xl border border-line bg-surface px-4 py-4">
        <p className="text-sm text-ink-soft">Registrerad omdirigerings-URI</p>
        <p className="mt-2 break-all font-mono text-sm">{registered}</p>
        <p className="mt-3 text-sm text-ink-soft">{status.reason}</p>
      </section>

      {error ? (
        <Notice>
          Revolut avvisade förfrågan ({error}
          {errorDescription ? `: ${errorDescription}` : ""}).
        </Notice>
      ) : null}

      {code ? (
        <section className="rounded-xl border border-line bg-surface px-4 py-4">
          <p className="text-sm text-ink-soft">Auktoriseringskod från Revolut</p>
          <p className="mt-2 break-all font-mono text-sm">{code}</p>
          <p className="mt-3 text-sm text-ink-soft">
            Koden byts mot access token med er privatnyckel och client_id (JWT iss = {status.host}).
            Tokenen klistras sedan in i slottet Revolut Business. Automatiskt tokenbyte är inte
            inkopplat förrän privatnyckel och client_id finns i miljön.
          </p>
        </section>
      ) : null}

      {!code && !error ? (
        <p className="text-sm text-ink-soft">
          Inget `code` i adressen. URI:n är registrerad och svarar. Fyll i den i Revoluts
          certifikatdialog när den är publik https.
        </p>
      ) : null}
    </AppShell>
  );
}
