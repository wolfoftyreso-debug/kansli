import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { CheckField, EmptyState, Field, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { listAgreements, type Agreement } from "@/lib/irma/agreements";
import { peekIssuedLink, publicIrmaUrl } from "@/lib/irma/issued-link";
import { daysUntilExpiry, effectiveStatus } from "@/lib/irma/status";
import { tryRuntime } from "@/lib/platform/page";
import { CopyIssuedLink } from "./CopyIssuedLink";
import { createIrmaAgreement } from "./actions";
import { irmaStatus, t, type Locale } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "irma.metaTitle"),
    description: t(locale, "irma.metaDescription"),
  };
}

function expiryCopy(locale: Locale, item: Agreement): string {
  if (item.status === "expired") return t(locale, "irma.expiry.expired");
  const days = daysUntilExpiry(item.tokenExpiresAt);
  if (days == null) return t(locale, "irma.expiry.waiting");
  if (days <= 0) return t(locale, "irma.expiry.expired");
  if (days === 1) return t(locale, "irma.expiry.oneDay");
  return t(locale, "irma.expiry.days", { days });
}

function needsAttention(item: Agreement): boolean {
  return item.status === "draft" || item.status === "viewed" || item.status === "expired";
}

function AgreementCard({ item, locale }: { item: Agreement; locale: Locale }) {
  return (
    <li className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        {irmaStatus(locale, item.status)}
      </p>
      <p className="mt-2 text-lg font-medium tracking-tight">
        <Link href={`/irma/${item.id}`} className="hover:underline">
          {item.title}
        </Link>
      </p>
      <p className="mt-1 text-sm text-ink-soft">{item.counterparty}</p>
      {item.status !== "signed" && item.status !== "cancelled" ? (
        <p className="mt-2 text-xs text-muted">{expiryCopy(locale, item)}</p>
      ) : null}
    </li>
  );
}

const STATUS_FILTERS = ["all", "waiting", "signed", "expired", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function parseStatusFilter(value: string | undefined): StatusFilter {
  return STATUS_FILTERS.includes(value as StatusFilter) ? (value as StatusFilter) : "all";
}

function matchesFilter(item: Agreement, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "waiting") return needsAttention(item);
  return effectiveStatus(item) === filter;
}

export default async function IrmaPage({
  searchParams,
}: {
  searchParams: Promise<{ issued?: string; q?: string; status?: string }>;
}) {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = parseStatusFilter(params.status);
  const agreements =
    session?.org?.ref && runtime
      ? await listAgreements(runtime.pool, session.org.ref, query || undefined)
      : [];
  const issued = params.issued === "1" ? await peekIssuedLink() : null;
  const waiting = query || status !== "all" ? [] : agreements.filter(needsAttention);
  const rest =
    query || status !== "all"
      ? agreements.filter((item) => matchesFilter(item, status))
      : agreements.filter((item) => !needsAttention(item));

  return (
    <AppShell current="irma" session={session}>
      <header className="flex flex-col gap-4 pt-4 sm:pt-8">
        <ProductCrumb crumbs={[{ href: "/irma", label: "IRMA" }]} />
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
          {t(locale, "irma.heading")}
        </h1>
        <p className="max-w-xl text-ink-soft">{t(locale, "irma.lead")}</p>
      </header>

      {issued ? (
        <section className="rounded-md border border-line bg-accent-soft px-3 py-3 text-sm text-ink-soft">
          <p>{t(locale, "irma.issuedBanner")}</p>
          <CopyIssuedLink
            url={publicIrmaUrl(issued)}
            copyLabel={t(locale, "irma.copyLink")}
            copiedLabel={t(locale, "irma.copied")}
          />
          <a
            href={issued}
            className="mt-2 inline-block font-medium text-ink underline decoration-line underline-offset-4"
          >
            {t(locale, "irma.openLink")}
          </a>
        </section>
      ) : null}

      {!session?.org ? (
        <SignInGate
          next="/irma"
          title={t(locale, "irma.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "irma.signInBody")}
        </SignInGate>
      ) : (
        <>
          {waiting.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-ink-soft">
                {t(locale, "irma.needsAttention")}
              </h2>
              <ul className="flex flex-col gap-3">
                {waiting.map((item) => (
                  <AgreementCard key={item.id} item={item} locale={locale} />
                ))}
              </ul>
            </section>
          ) : null}

          <form action={createIrmaAgreement} className="flex flex-col gap-4">
            <Field name="title" label={t(locale, "irma.field.title")} required large />
            <Field
              name="counterparty"
              label={t(locale, "irma.field.counterparty")}
              required
              large
            />
            <Field
              name="body"
              label={t(locale, "irma.field.body")}
              multiline
              large
              placeholder={t(locale, "irma.field.bodyPlaceholder")}
            />
            <CheckField
              name="requireAck"
              defaultChecked
              label={t(locale, "irma.field.requireAck")}
            />
            <Submit large>{t(locale, "irma.create")}</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <p className="flex flex-wrap gap-3 text-sm">
              <Link href="/irma" className="underline decoration-line underline-offset-4">
                {t(locale, "irma.filter.all")}
              </Link>
              <Link
                href="/irma?status=waiting"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "irma.filter.waiting")}
              </Link>
              <Link
                href="/irma?status=signed"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "irma.filter.signed")}
              </Link>
              <Link
                href="/irma?status=expired"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "irma.filter.expired")}
              </Link>
              <Link
                href="/irma?status=cancelled"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "irma.filter.cancelled")}
              </Link>
            </p>
            <form className="flex gap-2" action="/irma" method="get">
              {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
              <input
                name="q"
                defaultValue={query}
                placeholder={t(locale, "irma.searchPlaceholder")}
                className="min-h-12 flex-1 rounded-lg border border-line bg-paper px-4 py-3 text-base"
              />
              <button
                type="submit"
                className="min-h-12 rounded-lg border border-line px-4 text-sm text-ink-soft"
              >
                {t(locale, "irma.search")}
              </button>
            </form>
            {rest.length === 0 && waiting.length === 0 ? (
              <EmptyState>
                {query ? t(locale, "irma.emptySearch") : t(locale, "irma.empty")}
              </EmptyState>
            ) : rest.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {rest.map((item) => (
                  <AgreementCard key={item.id} item={item} locale={locale} />
                ))}
              </ul>
            ) : null}
          </section>
        </>
      )}
    </AppShell>
  );
}
