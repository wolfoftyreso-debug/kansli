import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { loadOpsSnapshot, opsScopeFor } from "@/lib/platform/ops";
import { tryRuntime } from "@/lib/platform/page";
import { getRuntime } from "@/lib/platform/runtime";
import { OpsBoard } from "./OpsBoard";
import { OpsSmsForm } from "./OpsSmsForm";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ops.metaTitle"),
    description: t(locale, "ops.metaDescription"),
  };
}

export default async function DriftPage() {
  const session = await readSession();
  const locale = await readLocale();
  const orgRef = session?.org?.ref ?? null;
  const scope = opsScopeFor(orgRef);
  const runtime = scope === "house" ? tryRuntime() : tryRuntime(orgRef);
  const snapshot =
    orgRef && runtime
      ? await loadOpsSnapshot(scope === "house" ? getRuntime().pool : runtime.pool, {
          orgRef,
          orgName: session?.org?.name ?? null,
          scope,
          locale,
        })
      : null;

  return (
    <AppShell current="drift" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb
          crumbs={[
            { href: "/platform", label: t(locale, "service.platform") },
            { href: "/platform/drift", label: t(locale, "service.ops") },
          ]}
        />
        <p className="pd-label">{t(locale, "ops.kicker")}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {session?.org?.name ?? t(locale, "ops.fallbackTitle")}
        </h1>
        <p className="text-ink-soft">
          {session?.org
            ? scope === "house"
              ? t(locale, "ops.leadHouse")
              : t(locale, "ops.leadWorkshop")
            : t(locale, "ops.leadSignedOut")}
        </p>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/platform/drift"
          title={t(locale, "ops.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ops.signInBody")}
        </SignInGate>
      ) : !snapshot ? (
        <Notice>{t(locale, "ops.dbDown")}</Notice>
      ) : (
        <>
          <OpsBoard initial={snapshot} locale={locale} />
          <OpsSmsForm sms={snapshot.sms} locale={locale} />
          <p className="text-sm text-faint">
            <Link href="/kansli/beredskap" className="underline decoration-line underline-offset-4">
              {t(locale, "ops.readiness")}
            </Link>
            {" · "}
            <Link href="/platform/events" className="underline decoration-line underline-offset-4">
              {t(locale, "service.events")}
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
            {" · "}
            <Link
              href="/api/platform/ops/debug"
              className="underline decoration-line underline-offset-4"
            >
              /api/platform/ops/debug
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
