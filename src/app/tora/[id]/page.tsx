import { notFound } from "next/navigation";
import type { OpportunityDetailResponse, OpportunityView } from "@pixdrift/tora";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { requirementStatusText } from "@/lib/tora/labels";
import { loadToraOpportunity, resolveViewTier } from "@/lib/tora/market";
import { resolveCompany } from "@/lib/tora/profile";
import {
  displayField,
  evaluationKindText,
  legalBasisText,
  sek,
  timingText,
  verdictText,
} from "@/lib/tora/view";

export const metadata = {
  title: "Möjlighet — TORA — Pixdrift",
};

export default async function ToraOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const runtime = tryRuntime(session?.org?.ref);
  const company = await resolveCompany(runtime?.pool ?? null, session?.org?.ref ?? null);
  const tier = resolveViewTier({
    sessionTier: session?.org?.tier,
    usingDemoCompany: company.id === "comp:tyresoel",
  });
  const detail = loadToraOpportunity(tier, decodeURIComponent(id), company);
  if (!detail) notFound();

  const view = detail.view;
  const basis = legalBasisText(view.legalBasis);

  return (
    <AppShell current="tora" session={session}>
      <ProductCrumb crumbs={[{ href: "/tora", label: "TORA" }]} />
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium text-accent">{verdictText(view.verdict)}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{displayField(view.title)}</h1>
        <p className="text-ink-soft">{displayField(view.organizationName)}</p>
        <p className="font-mono text-xs text-faint">
          {view.scoreBand} · {view.organizationKindHint} · {timingText(view.timing)}
        </p>
      </header>

      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-lg font-semibold">Varför ni får lämna anbud</h2>
        <p className="mt-2 text-sm text-ink-soft">{basis.reason}</p>
        {basis.contractId ? (
          <p className="mt-2 font-mono text-xs text-faint">{basis.contractId}</p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Bedömning</h2>
        <p className="text-sm text-ink-soft">{displayField(view.rationale)}</p>
        <p className="text-sm text-muted">{displayField(view.accessExplanation)}</p>
        <p className="text-sm text-muted">
          Sista anbudsdag: {displayField(view.deadlineAt)}
          {view.estimatedValueSek.state === "unlocked" &&
          typeof view.estimatedValueSek.value === "number"
            ? ` · ${sek(view.estimatedValueSek.value)}`
            : ""}
        </p>
      </section>

      {view.caveats.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Förbehåll</h2>
          <ul className="flex flex-col gap-2">
            {view.caveats.map((caveat) => (
              <li
                key={caveat.key}
                className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft"
              >
                {caveat.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <QualificationBlock view={view} />
      <ScoreBlock view={view} />
      <ValueBlock detail={detail} />
      <EvaluationBlock detail={detail} />
      <Actions detail={detail} />
      <WalkthroughBlock detail={detail} />
      <DocumentsBlock detail={detail} />
      <RemediesBlock detail={detail} />
      <QuestionsBlock detail={detail} />

      <Notice>
        Betalkonto. Ni ser hela bedömningen för {company.name}: krav, belopp och nästa steg.
      </Notice>
    </AppShell>
  );
}

function QualificationBlock({ view }: { view: OpportunityView }) {
  if (view.qualification.state === "locked") {
    return (
      <section>
        <h2 className="text-lg font-semibold">Krav mot ert bolag</h2>
        <p className="mt-2 text-sm text-muted">{view.qualification.teaser}</p>
      </section>
    );
  }
  const qualification = view.qualification.value;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Krav mot ert bolag</h2>
      <p className="text-sm text-ink-soft">
        {qualification.counts.met} uppfyllda, {qualification.counts.remediable} går att fixa,{" "}
        {qualification.counts.unmet} saknas
        {qualification.counts.unknown > 0 ? `, ${qualification.counts.unknown} okända` : ""}.
      </p>
      {qualification.explanation ? (
        <p className="text-sm text-muted">{qualification.explanation}</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {qualification.assessments.map((item) => (
          <li
            key={item.requirementId}
            className="rounded-xl border border-line bg-surface px-4 py-3"
          >
            <p className="text-xs font-medium text-accent">{requirementStatusText(item.status)}</p>
            <p className="mt-1 font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-ink-soft">{item.explanation}</p>
            {item.remediation ? (
              <p className="mt-1 text-sm text-muted">{item.remediation.action}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScoreBlock({ view }: { view: OpportunityView }) {
  if (view.score.state === "locked") {
    return (
      <section>
        <h2 className="text-lg font-semibold">Poäng</h2>
        <p className="mt-2 text-sm text-muted">{view.score.teaser}</p>
      </section>
    );
  }
  const score = view.score.value;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Poäng</h2>
      <p className="text-sm text-ink-soft">{score.explanation}</p>
      <p className="font-mono text-xs text-faint">
        {Math.round(score.score)} av 100 · {Math.round(score.confidence * 100)} % av underlaget går
        att räkna på
      </p>
      <ul className="flex flex-col gap-2">
        {score.factors.map((factor) => (
          <li key={factor.key} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="font-medium">{factor.label}</p>
            <p className="mt-1 text-sm text-ink-soft">{factor.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ValueBlock({ detail }: { detail: OpportunityDetailResponse }) {
  const field = detail.value;
  if (field.state === "locked") {
    return (
      <section>
        <h2 className="text-lg font-semibold">Värde</h2>
        <p className="mt-2 text-sm text-muted">{field.teaser}</p>
      </section>
    );
  }
  const value = field.value;
  if (!value) {
    return (
      <section>
        <h2 className="text-lg font-semibold">Värde</h2>
        <p className="mt-2 text-sm text-muted">Vi har inget värde att visa.</p>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Värde</h2>
      <p className="text-sm text-ink-soft">{value.explanation}</p>
      <p className="font-mono text-xs text-faint">
        {value.securedMonths} säkrade månader
        {value.undecidedOptionMonths > 0
          ? ` · ${value.undecidedOptionMonths} oavgjorda optionsmånader`
          : ""}
        {typeof value.totalValueSek === "number" ? ` · ${sek(value.totalValueSek)} publicerat` : ""}
        {typeof value.annualValueSek === "number" ? ` · ${sek(value.annualValueSek)} / år` : ""}
      </p>
      <p className="text-sm text-muted">{value.yourShare.explanation}</p>
    </section>
  );
}

function EvaluationBlock({ detail }: { detail: OpportunityDetailResponse }) {
  const field = detail.evaluation;
  if (field.state === "locked") {
    return (
      <section>
        <h2 className="text-lg font-semibold">Utvärdering</h2>
        <p className="mt-2 text-sm text-muted">{field.teaser}</p>
      </section>
    );
  }
  const evaluation = field.value;
  if (!evaluation) {
    return (
      <section>
        <h2 className="text-lg font-semibold">Utvärdering</h2>
        <p className="mt-2 text-sm text-muted">Ingen utvärderingsmodell i underlaget.</p>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Utvärdering</h2>
      <p className="text-sm text-ink-soft">{evaluationKindText(evaluation.kind)}</p>
      {evaluation.criteria.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {evaluation.criteria.map((criterion) => (
            <li
              key={criterion.name}
              className="rounded-xl border border-line bg-surface px-4 py-3 text-sm"
            >
              {criterion.name}
              <span className="ml-2 font-mono text-xs text-faint">{criterion.weightPct} %</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Actions({ detail }: { detail: OpportunityDetailResponse }) {
  const field = detail.view.recommendedActions;
  if (field.state === "locked") {
    return (
      <section>
        <h2 className="text-lg font-semibold">Att göra</h2>
        <p className="mt-2 text-sm text-muted">{field.teaser}</p>
      </section>
    );
  }
  if (!field.value.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Att göra</h2>
      <ul className="flex flex-col gap-2">
        {field.value.map((action) => (
          <li key={action.label} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="font-medium">{action.label}</p>
            <p className="mt-1 text-sm text-ink-soft">{action.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WalkthroughBlock({ detail }: { detail: OpportunityDetailResponse }) {
  const walkthrough = detail.walkthrough;
  if (!walkthrough) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Processen</h2>
      <p className="text-sm text-ink-soft">{walkthrough.whereYouAre}</p>
      <ol className="flex flex-col gap-2">
        {walkthrough.stages.map((entry) => (
          <li key={entry.stage.id} className="rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {entry.position}
            </p>
            <p className="mt-1 font-medium">{entry.stage.title}</p>
            {entry.date ? <p className="font-mono text-xs text-faint">{entry.date}</p> : null}
            {entry.dateUnknownReason ? (
              <p className="mt-1 text-sm text-muted">{entry.dateUnknownReason}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function DocumentsBlock({ detail }: { detail: OpportunityDetailResponse }) {
  const docs = detail.documents;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Handlingar</h2>
      <p className="text-sm text-ink-soft">{docs.explanation}</p>
      {docs.status === "ready" ? (
        <ul className="flex flex-col gap-2">
          {docs.items.map((item) => (
            <li
              key={item.evidence.id}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {item.urgency}
              </p>
              <p className="mt-1 font-medium">{item.evidence.title}</p>
              {item.startBy ? (
                <p className="font-mono text-xs text-faint">börja senast {item.startBy}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function RemediesBlock({ detail }: { detail: OpportunityDetailResponse }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Så kan ni överklaga</h2>
      <p className="text-sm text-ink-soft">{detail.remedies.summary}</p>
      <ul className="flex flex-col gap-2">
        {detail.remedies.windows.map((window) => (
          <li
            key={window.remedy.key}
            className="rounded-xl border border-line bg-surface px-4 py-3"
          >
            <p className="font-medium">{window.remedy.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{window.basis}</p>
            {window.closesOn ? (
              <p className="mt-1 font-mono text-xs text-faint">stänger {window.closesOn}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuestionsBlock({ detail }: { detail: OpportunityDetailResponse }) {
  const plan = detail.questions;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Frågor</h2>
      <p className="text-sm text-ink-soft">{plan.summary}</p>
      {plan.status === "ready" ? (
        <ul className="flex flex-col gap-2">
          {plan.questions.map((question) => (
            <li key={question.id} className="rounded-xl border border-line bg-surface px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {question.kind}
              </p>
              <p className="mt-1 font-medium">{question.subject}</p>
              <p className="mt-1 text-sm text-ink-soft">{question.draft}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
