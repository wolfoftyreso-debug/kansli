import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate } from "@/components/app/SignInGate";
import { listTransactions } from "@/lib/ekonomi/journal";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.vouch.metaTitle"),
    description: t(locale, "ekonomi.vouch.metaDescription"),
  };
}

export default async function VerifikatPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const rows =
    session?.org?.ref && runtime ? await listTransactions(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/verifikat", label: t(locale, "ekonomi.vouchers") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">
        {t(locale, "ekonomi.vouch.heading")}
      </h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "ekonomi.vouch.lead")}</p>
      {!session ? (
        <SignInGate
          next="/ekonomi/verifikat"
          title={t(locale, "ekonomi.vouch.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.vouch.signInBody")}
        </SignInGate>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted">{t(locale, "ekonomi.vouch.empty")}</p>
          ) : null}
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-surface px-4 py-3">
              <p className="text-sm font-medium">{row.description}</p>
              <p className="mt-1 text-xs text-muted">{row.template}</p>
              <p className="mt-2 break-all font-mono text-xs text-faint">{row.hash}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
