/**
 * Alert engine — where the product stops being a database and starts being an
 * agent.
 *
 * Alerts are derived by diffing two snapshots of a company's opportunities
 * rather than by firing on raw source events. That matters: a buyer editing a
 * clause is noise, but a buyer editing a clause *that flips this company from
 * eligible to not eligible* is the most important message the product will ever
 * send. The diff is what knows the difference.
 */

import { daysBetween, type IsoDate } from "../domain/ontology";
import type { Verdict } from "../domain/verdicts";
import type { Opportunity } from "./opportunity";

export type AlertType =
  | "new_opportunity"
  | "deadline_approaching"
  | "verdict_improved"
  | "verdict_worsened"
  | "requirements_changed"
  | "score_changed"
  | "opportunity_closed"
  | "contract_expiring"
  | "admission_window_closing";

export type AlertSeverity = "critical" | "high" | "normal" | "low";

export type AlertChannel = "sms" | "email" | "push";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  body: string;
  opportunityId?: string;
  channels: AlertChannel[];
  occurredAt: IsoDate;
}

/** Days before a deadline at which the company is nudged. */
export const DEADLINE_REMINDER_DAYS = [30, 14, 7, 3, 1];

/**
 * SMS is reserved for things that are both time-critical and irreversible if
 * missed. Everything else is email and push — an alert channel that cries wolf
 * gets muted, and then the one that mattered is muted too.
 */
function channelsFor(severity: AlertSeverity): AlertChannel[] {
  switch (severity) {
    case "critical":
      return ["sms", "push", "email"];
    case "high":
      return ["push", "email"];
    case "normal":
      return ["push", "email"];
    case "low":
      return ["email"];
  }
}

function alert(
  partial: Omit<Alert, "channels" | "id"> & { id: string },
): Alert {
  return { ...partial, channels: channelsFor(partial.severity) };
}

/** Verdicts ordered from worst to best, so a change has a direction. */
const VERDICT_RANK: Record<Verdict, number> = {
  NOT_ELIGIBLE: 0,
  UNKNOWN: 1,
  POSSIBLE: 2,
  COMPETITIVE: 3,
  ELIGIBLE: 4,
  RIGHT: 5,
};

export interface AlertOptions {
  /** Score movements smaller than this are not worth a message. */
  scoreChangeThreshold?: number;
}

/**
 * Compares the previous snapshot with the current one and returns what the
 * company should be told.
 */
export function diffOpportunities(
  previous: Opportunity[],
  current: Opportunity[],
  today: IsoDate,
  options: AlertOptions = {},
): Alert[] {
  const scoreThreshold = options.scoreChangeThreshold ?? 10;
  const previousById = new Map(previous.map((o) => [o.id, o]));
  const currentById = new Map(current.map((o) => [o.id, o]));
  const alerts: Alert[] = [];

  current.forEach((opportunity) => {
    const before = previousById.get(opportunity.id);

    if (!before) {
      // A brand-new opportunity is only worth interrupting someone for when they
      // could actually act on it.
      const actionable =
        opportunity.verdict !== "NOT_ELIGIBLE" && opportunity.timing !== "closed" && opportunity.timing !== "watch";
      alerts.push(
        alert({
          id: `alert:new:${opportunity.id}`,
          type: "new_opportunity",
          severity: actionable ? "high" : "low",
          title: `Ny möjlighet: ${opportunity.title}`,
          body:
            `${opportunity.organizationName}. Bedömning: ${opportunity.verdict}. ` +
            `Poäng ${opportunity.score.score}/100. ${opportunity.rationale}`,
          opportunityId: opportunity.id,
          occurredAt: today,
        }),
      );
      return;
    }

    if (before.verdict !== opportunity.verdict) {
      const improved = VERDICT_RANK[opportunity.verdict] > VERDICT_RANK[before.verdict];
      alerts.push(
        alert({
          id: `alert:verdict:${opportunity.id}:${opportunity.verdict}`,
          type: improved ? "verdict_improved" : "verdict_worsened",
          // Losing eligibility on something you were preparing a bid for is the
          // single most expensive surprise in this domain.
          severity: improved ? "normal" : "critical",
          title: improved
            ? `Förbättrad bedömning: ${opportunity.title}`
            : `Försämrad bedömning: ${opportunity.title}`,
          body:
            `${opportunity.organizationName}: ${before.verdict} → ${opportunity.verdict}. ` +
            opportunity.rationale,
          opportunityId: opportunity.id,
          occurredAt: today,
        }),
      );
    }

    const requirementsBefore = before.qualification.assessments.length;
    const requirementsNow = opportunity.qualification.assessments.length;
    if (requirementsBefore !== requirementsNow) {
      alerts.push(
        alert({
          id: `alert:requirements:${opportunity.id}:${requirementsNow}`,
          type: "requirements_changed",
          severity: "high",
          title: `Ändrade krav: ${opportunity.title}`,
          body:
            `Antalet redovisade krav har ändrats från ${requirementsBefore} till ${requirementsNow}. ` +
            "Gå igenom kravmatrisen på nytt.",
          opportunityId: opportunity.id,
          occurredAt: today,
        }),
      );
    }

    const scoreDelta = opportunity.score.score - before.score.score;
    if (Math.abs(scoreDelta) >= scoreThreshold) {
      alerts.push(
        alert({
          id: `alert:score:${opportunity.id}:${opportunity.score.score}`,
          type: "score_changed",
          severity: "low",
          title: `Förändrad möjlighetspoäng: ${opportunity.title}`,
          body: `${before.score.score} → ${opportunity.score.score} av 100. ${opportunity.score.explanation}`,
          opportunityId: opportunity.id,
          occurredAt: today,
        }),
      );
    }

    if (before.timing !== "closed" && opportunity.timing === "closed") {
      alerts.push(
        alert({
          id: `alert:closed:${opportunity.id}`,
          type: "opportunity_closed",
          severity: "low",
          title: `Stängd: ${opportunity.title}`,
          body: `${opportunity.organizationName}. ${opportunity.access.explanation}`,
          opportunityId: opportunity.id,
          occurredAt: today,
        }),
      );
    }
  });

  previous
    .filter((o) => !currentById.has(o.id))
    .forEach((o) => {
      alerts.push(
        alert({
          id: `alert:removed:${o.id}`,
          type: "opportunity_closed",
          severity: "low",
          title: `Möjligheten finns inte längre: ${o.title}`,
          body: `${o.organizationName}. Underlaget har försvunnit ur källorna.`,
          opportunityId: o.id,
          occurredAt: today,
        }),
      );
    });

  return alerts;
}

/** Deadline reminders at fixed distances, for opportunities worth bidding on. */
export function deadlineAlerts(opportunities: Opportunity[], today: IsoDate): Alert[] {
  return opportunities
    .filter((o) => o.timing === "open_now" && o.verdict !== "NOT_ELIGIBLE")
    .flatMap((opportunity) => {
      const date = opportunity.deadlineAt ?? opportunity.prediction?.expectedAnnouncement.from;
      if (!date) return [];
      const days = daysBetween(today, date);
      if (!DEADLINE_REMINDER_DAYS.includes(days)) return [];

      const isAdmission = opportunity.deadlineAt === undefined;
      return [
        alert({
          id: `alert:deadline:${opportunity.id}:${days}`,
          type: isAdmission ? "admission_window_closing" : "deadline_approaching",
          severity: days <= 3 ? "critical" : days <= 7 ? "high" : "normal",
          title: `${days} ${days === 1 ? "dag" : "dagar"} kvar: ${opportunity.title}`,
          body:
            `${opportunity.organizationName}. Sista dag ${date}. ` +
            (opportunity.recommendedActions[0]
              ? `Nästa steg: ${opportunity.recommendedActions[0].label}.`
              : ""),
          opportunityId: opportunity.id,
          occurredAt: today,
        }),
      ];
    });
}

/** Renders an alert into the 160-character shape an SMS actually has to fit. */
export function renderSms(alert: Alert): string {
  const prefix = "TORA: ";
  const body = `${alert.title}. ${alert.body}`;
  const room = 160 - prefix.length;
  return prefix + (body.length <= room ? body : `${body.slice(0, room - 1).trimEnd()}…`);
}
