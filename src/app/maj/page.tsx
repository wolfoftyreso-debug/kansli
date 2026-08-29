import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import {
  EmptyState,
  Field,
  Notice,
  SelectField,
  SignInGate,
  Submit,
} from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t, type MessageKey } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { isHouseSession } from "@/lib/kansli/intakes";
import { capabilityStatuses } from "@/lib/maj/engine";
import { MAJ_GOALS, listProjects, type MajGoal } from "@/lib/maj/projects";
import { tryRuntime } from "@/lib/platform/page";
import { createMajProject } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "maj.metaTitle"),
    description: t(locale, "maj.metaDescription"),
  };
}

const MARKETS = ["SE", "NO", "DK", "FI", "DE"] as const;
const LANGUAGES = ["sv", "no", "da", "fi", "de", "en"] as const;
const GOAL_KEY = {
  customers: "maj.goal.customers",
  rank: "maj.goal.rank",
  competitors: "maj.goal.competitors",
  authority: "maj.goal.authority",
  all: "maj.goal.all",
} as const;

export default async function MajPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const internal = isHouseSession(session?.org?.ref);
  const projects =
    session?.org?.ref && runtime && internal
      ? await listProjects(runtime.pool, session.org.ref)
      : [];
  const capabilities = capabilityStatuses();

  return (
    <AppShell current="maj" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/maj", label: "MAJ" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "maj.heading")}</h1>
        <p className="max-w-xl text-ink-soft">{t(locale, "maj.lead")}</p>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/maj"
          title={t(locale, "maj.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "maj.signInBody")}
        </SignInGate>
      ) : !internal ? (
        <Notice>{t(locale, "maj.alpha")}</Notice>
      ) : (
        <>
          <form
            action={createMajProject}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "maj.addSite")}</h2>
            <Field
              name="domain"
              label={t(locale, "maj.domain")}
              required
              placeholder="example.se"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                name="market"
                label={t(locale, "maj.market")}
                placeholder={t(locale, "maj.market.SE")}
                defaultValue="SE"
                options={MARKETS.map((value) => ({
                  value,
                  label: t(locale, `maj.market.${value}` as MessageKey),
                }))}
              />
              <SelectField
                name="language"
                label={t(locale, "maj.languageField")}
                placeholder={t(locale, "maj.language.en")}
                defaultValue="en"
                options={LANGUAGES.map((value) => ({
                  value,
                  label: t(locale, `maj.language.${value}` as MessageKey),
                }))}
              />
            </div>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-sm text-ink-soft">{t(locale, "maj.goal")}</legend>
              {MAJ_GOALS.map((goal: MajGoal) => (
                <label key={goal} className="flex min-h-9 items-center gap-2 text-sm text-ink-soft">
                  <input type="radio" name="goal" value={goal} defaultChecked={goal === "all"} />
                  <span>{t(locale, GOAL_KEY[goal])}</span>
                </label>
              ))}
            </fieldset>
            <Submit>{t(locale, "maj.submit")}</Submit>
            <p className="text-xs text-muted">{t(locale, "maj.submitHint")}</p>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "maj.sources")}</h2>
            <p className="text-sm text-ink-soft">
              {capabilities
                .map(
                  (cap) =>
                    `${t(locale, `maj.cap.${cap.id}` as MessageKey)} ${t(locale, cap.configured ? "maj.cap.on" : "maj.cap.off")}`,
                )
                .join(" · ")}
            </p>
            <p className="text-xs text-muted">{t(locale, "maj.sourcesHint")}</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "maj.projects")}</h2>
            {projects.length === 0 ? (
              <EmptyState>{t(locale, "maj.noProjects")}</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {projects.map((project) => (
                  <li key={project.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="font-medium">
                      <Link href={`/maj/${project.id}`} className="hover:underline">
                        {project.domain}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {project.market} · {project.language} · {t(locale, GOAL_KEY[project.goal])}
                    </p>
                    <p className="mt-2 text-xs text-faint">
                      {formatDateTime(project.createdAt, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
