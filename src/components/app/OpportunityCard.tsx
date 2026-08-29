import Link from "next/link";
import type { OpportunityView } from "@pixdrift/tora";
import { t, toraReqStatus, type Locale } from "@/lib/i18n";
import { displayField, opportunityHref, sek, verdictText } from "@/lib/tora/view";

export function OpportunityCard({ item, locale }: { item: OpportunityView; locale: Locale }) {
  const title = displayField(item.title);
  const buyer = displayField(item.organizationName);
  const why = displayField(item.rationale);
  const qualification = item.qualification.state === "unlocked" ? item.qualification.value : null;
  const actions = item.recommendedActions.state === "unlocked" ? item.recommendedActions.value : [];
  const next = actions[0];
  const score =
    item.score.state === "unlocked" && typeof item.score.value.score === "number"
      ? String(Math.round(item.score.value.score))
      : item.scoreBand;
  const deadline =
    item.deadlineAt.state === "unlocked" && item.deadlineAt.value
      ? t(locale, "tora.card.deadline", { date: item.deadlineAt.value })
      : null;
  const value =
    item.estimatedValueSek.state === "unlocked" && typeof item.estimatedValueSek.value === "number"
      ? sek(item.estimatedValueSek.value)
      : null;
  const checks = (qualification?.assessments ?? []).slice(0, 4);

  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-accent">{verdictText(item.verdict)}</p>
        <p className="font-mono text-xs text-faint">{score}</p>
      </div>
      <p className="mt-2 font-medium">
        <Link href={opportunityHref(item)} className="hover:underline">
          {title}
        </Link>
      </p>
      <p className="mt-1 text-sm text-ink-soft">{buyer}</p>
      <p className="mt-2 text-sm text-muted">{why}</p>
      {deadline || value ? (
        <p className="mt-2 font-mono text-xs text-faint">
          {[deadline, value].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {checks.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1">
          {checks.map((check) => (
            <li key={check.requirementId} className="text-sm">
              <span className="font-medium">{toraReqStatus(locale, check.status)}</span>
              <span className="text-ink-soft"> — {check.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {next ? (
        <p className="mt-3 text-sm">
          <span className="font-medium">{t(locale, "tora.card.next")} </span>
          <span className="text-ink-soft">{next.label}</span>
        </p>
      ) : null}
    </li>
  );
}
