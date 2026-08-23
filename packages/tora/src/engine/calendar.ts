/**
 * Procurement calendar.
 *
 * Turns opportunities into dated obligations. The horizon buckets are the ones a
 * small company actually plans in: this week, this month, this quarter, this
 * year. Anything further out belongs on the radar, not the calendar.
 */

import { daysBetween, type IsoDate } from "../domain/ontology";
import type { Opportunity } from "./opportunity";

export type CalendarEntryKind =
  | "deadline"
  | "admission_deadline"
  | "expected_announcement"
  | "contract_end"
  | "action";

export interface CalendarEntry {
  date: IsoDate;
  kind: CalendarEntryKind;
  opportunityId: string;
  organizationName: string;
  title: string;
  detail: string;
  /** `true` when the date is a prediction rather than a published fact. */
  predicted: boolean;
  daysAway: number;
}

export interface ProcurementCalendar {
  thisWeek: CalendarEntry[];
  next30Days: CalendarEntry[];
  next90Days: CalendarEntry[];
  next12Months: CalendarEntry[];
  /** Everything, ordered by date — useful for an agenda view. */
  all: CalendarEntry[];
}

export function buildCalendar(opportunities: Opportunity[], today: IsoDate): ProcurementCalendar {
  const entries: CalendarEntry[] = [];

  const push = (entry: Omit<CalendarEntry, "daysAway">) => {
    const daysAway = daysBetween(today, entry.date);
    if (daysAway < 0) return; // the calendar is forward-looking; history lives elsewhere
    entries.push({ ...entry, daysAway });
  };

  opportunities.forEach((opportunity) => {
    // Nothing the company cannot reach earns a place on its calendar. A deadline
    // for a framework you are locked out of is not a date — it is clutter, and
    // clutter is how a calendar stops being read.
    if (opportunity.verdict === "NOT_ELIGIBLE") return;

    const common = {
      opportunityId: opportunity.id,
      organizationName: opportunity.organizationName,
      title: opportunity.title,
    };

    if (opportunity.deadlineAt && opportunity.timing !== "closed") {
      push({
        ...common,
        date: opportunity.deadlineAt,
        kind: "deadline",
        detail: "Sista anbudsdag.",
        predicted: false,
      });
    }

    if (opportunity.prediction) {
      push({
        ...common,
        date: opportunity.prediction.expectedAnnouncement.from,
        kind: "expected_announcement",
        detail:
          `Tidigast förväntad annonsering. Prognos med ${Math.round(opportunity.prediction.confidence * 100)} % ` +
          "tillförlitlighet, se underlaget.",
        predicted: true,
      });
      push({
        ...common,
        date: opportunity.prediction.effectiveEnd.earliest,
        kind: "contract_end",
        detail: "Nuvarande avtal löper ut tidigast detta datum.",
        predicted: true,
      });
    }

    opportunity.recommendedActions
      .filter((action) => action.dueBy !== undefined)
      .forEach((action) => {
        push({
          ...common,
          date: action.dueBy as IsoDate,
          kind: "action",
          detail: `${action.label}: ${action.detail}`,
          predicted: opportunity.prediction !== undefined,
        });
      });
  });

  const all = entries.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));

  return {
    thisWeek: all.filter((e) => e.daysAway <= 7),
    next30Days: all.filter((e) => e.daysAway > 7 && e.daysAway <= 30),
    next90Days: all.filter((e) => e.daysAway > 30 && e.daysAway <= 90),
    next12Months: all.filter((e) => e.daysAway > 90 && e.daysAway <= 365),
    all,
  };
}
