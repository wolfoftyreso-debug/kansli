import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import {
  requestBacklinksOverview,
  requestDomainOverview,
  requestOrganicKeywords,
  webintelConfigured,
  WEBINTEL_BACKLINKS_UNITS,
  WEBINTEL_DOMAIN_RANKS_UNITS,
  WEBINTEL_ORGANIC_DEFAULT_LIMIT,
  WEBINTEL_ORGANIC_LINE_UNITS,
  type BacklinksReport,
  type OrganicKeywordsReport,
  type WebIntelReport,
} from "../platform/webintel.ts";
import { bookUsage } from "./usage.ts";
import type { MajProject } from "./projects.ts";

/**
 * The analysis engine. Capability adapters in, evidence-backed decisions out.
 * Business logic is capability-named (`keywordOpportunity`, never a vendor
 * name). Sources that lack credentials fail closed and become connect-source
 * decisions instead of invented numbers.
 */

export interface CapabilityStatus {
  id: "webintel" | "search-console" | "analytics" | "crawler";
  label: string;
  configured: boolean;
}

export function capabilityStatuses(
  env: Record<string, string | undefined> = process.env,
): CapabilityStatus[] {
  return [
    { id: "webintel", label: "Search visibility", configured: webintelConfigured(env) },
    {
      id: "search-console",
      label: "Search Console",
      configured: Boolean(env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS?.trim()),
    },
    {
      id: "analytics",
      label: "Analytics",
      configured: Boolean(env.GOOGLE_ANALYTICS_CREDENTIALS?.trim()),
    },
    { id: "crawler", label: "Technical crawl", configured: false },
  ];
}

export interface MajSignal {
  id: string;
  source: string;
  kind: string;
  payload: Record<string, unknown>;
  observedAt: string;
}

export async function listSignals(
  pool: pg.Pool,
  orgRef: string,
  projectId: string,
): Promise<MajSignal[]> {
  const { rows } = await pool.query(
    `select id, source, kind, payload, observed_at from maj.signals
      where org_ref = $1 and project_id = $2 order by observed_at desc limit 50`,
    [orgRef, projectId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    source: String(row.source),
    kind: String(row.kind),
    payload: (row.payload ?? {}) as Record<string, unknown>,
    observedAt: new Date(String(row.observed_at)).toISOString(),
  }));
}

async function recordSignal(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  projectId: string;
  source: string;
  kind: string;
  payload: Record<string, unknown>;
  requestId: string;
}): Promise<void> {
  const id = randomUUID();
  await input.pool.query(
    `insert into maj.signals (id, org_ref, project_id, source, kind, payload)
     values ($1,$2,$3,$4,$5,$6)`,
    [id, input.orgRef, input.projectId, input.source, input.kind, input.payload],
  );
  await input.events.publish({
    system: "maj",
    kind: "maj.signal.recorded",
    orgRef: input.orgRef,
    actorKind: "system",
    actorRef: input.actorRef,
    subjectRef: `maj:signal:${id}`,
    requestId: `${input.requestId}-sig-${input.kind}`,
    payload: { title: `${input.kind} from ${input.source}`, projectId: input.projectId },
  });
}

export interface ProposedAction {
  kind: "connect_source" | "competitive" | "content" | "technical" | "links";
  title: string;
  why: string;
  risk: "low" | "medium" | "high";
  expectedImpact: "low" | "medium" | "high";
  confidence: number;
  evidence: Record<string, unknown>[];
}

/**
 * rule.v1 — deterministic strategist. Proposes only what the evidence
 * supports. LLM strategists join the arena later and are judged the same way.
 */
export function ruleStrategist(input: {
  project: MajProject;
  overview: WebIntelReport | null;
  keywords: OrganicKeywordsReport | null;
  backlinks: BacklinksReport | null;
  capabilities: CapabilityStatus[];
}): ProposedAction[] {
  const proposals: ProposedAction[] = [];
  const hedge = input.project.posture === "hedge" || input.project.posture === "aggressive";

  const searchVisibility = input.capabilities.find((cap) => cap.id === "webintel");
  if (searchVisibility && !searchVisibility.configured) {
    proposals.push({
      kind: "connect_source",
      title: "Connect search visibility",
      why: "Without a search-visibility source the system cannot measure rank, keywords or backlinks. The source stays a channel — you will still see decisions, not vendor dashboards.",
      risk: "low",
      expectedImpact: "high",
      confidence: 98,
      evidence: [{ capability: "webintel", configured: false }],
    });
  }

  const searchConsole = input.capabilities.find((cap) => cap.id === "search-console");
  if (searchConsole && !searchConsole.configured) {
    proposals.push({
      kind: "connect_source",
      title: "Connect Search Console",
      why: "Without Search Console the system cannot see which queries already show your pages, where clicks drop, or where demand already exists. It is the single most important first-party source and it is free.",
      risk: "low",
      expectedImpact: "high",
      confidence: 95,
      evidence: [{ capability: "search-console", configured: false }],
    });
  }
  const analytics = input.capabilities.find((cap) => cap.id === "analytics");
  if (analytics && !analytics.configured) {
    proposals.push({
      kind: "connect_source",
      title: "Connect Analytics",
      why: "Analytics ties search data to what visitors actually do. Without it the system can see traffic but not business effect.",
      risk: "low",
      expectedImpact: "medium",
      confidence: 90,
      evidence: [{ capability: "analytics", configured: false }],
    });
  }

  if (input.overview?.ok) {
    proposals.push({
      kind: "competitive",
      title: "Confirm the competitor set",
      why: `The baseline for ${input.overview.domain} is set: ${input.overview.organicKeywords ?? "an unknown number of"} organic keywords and rank ${input.overview.rank ?? "unknown"} in the market. Next step is to confirm which competitors to watch — the wrong set poisons every later decision.`,
      risk: "low",
      expectedImpact: "high",
      confidence: 87,
      evidence: [{ capability: "webintel", kind: "domain_overview", data: { ...input.overview } }],
    });
    if (input.overview.adwordsKeywords === null || input.overview.adwordsKeywords === "0") {
      proposals.push({
        kind: "content",
        title: "Protect the brand search",
        why: "The source sees no paid presence for the domain. Once the organic baseline is set, brand search should be checked so a competitor cannot sit above your own name.",
        risk: "low",
        expectedImpact: "medium",
        confidence: 70,
        evidence: [
          {
            capability: "webintel",
            field: "adwordsKeywords",
            value: input.overview.adwordsKeywords,
          },
        ],
      });
    }
  }

  if (input.keywords?.ok && input.keywords.keywords.length > 0) {
    const phrases = input.keywords.keywords
      .slice(0, 5)
      .map((row) => row.phrase)
      .join(", ");
    proposals.push({
      kind: "content",
      title: "Publish pages for the keyword gaps",
      why: `The keyword baseline names these phrases: ${phrases}. The next pages should cover the ones you do not already own — with your own facts, not invented copy.`,
      risk: "low",
      expectedImpact: hedge ? "high" : "medium",
      confidence: 78,
      evidence: [{ capability: "keywords", kind: "domain_organic", data: { ...input.keywords } }],
    });
  }

  if (input.backlinks?.ok) {
    proposals.push({
      kind: "links",
      title: "Review the backlink baseline",
      why: `Referring domains ${input.backlinks.referringDomains ?? "unknown"}, total links ${input.backlinks.total ?? "unknown"}, authority ${input.backlinks.ascore ?? "unknown"}. Outreach is drafted, never sent. No purchased links.`,
      risk: "medium",
      expectedImpact: "medium",
      confidence: 74,
      evidence: [
        { capability: "backlinks", kind: "backlinks_overview", data: { ...input.backlinks } },
      ],
    });
  }

  if (hedge && input.overview?.ok) {
    proposals.push({
      kind: "competitive",
      title: "Close the lawful competitive gap",
      why: "HEDGE means maximal lawful response: better pages, clearer comparisons, digital PR. Never fake reviews, click fraud, negative links, impersonation or misleading pages — those create legal risk and harm your own ranking.",
      risk: "medium",
      expectedImpact: "high",
      confidence: 72,
      evidence: [{ capability: "webintel", posture: input.project.posture, kind: "hedge_lawful" }],
    });
  }

  return proposals;
}

export interface MajAction {
  id: string;
  kind: string;
  title: string;
  why: string;
  risk: string;
  expectedImpact: string;
  confidence: number;
  state: "proposed" | "approved" | "declined" | "done";
  evidence: Record<string, unknown>[];
  createdAt: string;
  decidedAt: string | null;
}

const ACTION_COLUMNS = `id, kind, title, why, risk, expected_impact, confidence, state,
  evidence, created_at, decided_at`;

export async function listActions(
  pool: pg.Pool,
  orgRef: string,
  projectId: string,
): Promise<MajAction[]> {
  const { rows } = await pool.query(
    `select ${ACTION_COLUMNS} from maj.actions
      where org_ref = $1 and project_id = $2
      order by case state when 'proposed' then 0 when 'approved' then 1 else 2 end, created_at desc`,
    [orgRef, projectId],
  );
  return rows.map(toAction);
}

export async function getAction(
  pool: pg.Pool,
  orgRef: string,
  actionId: string,
): Promise<(MajAction & { projectId: string }) | null> {
  const { rows } = await pool.query(
    `select ${ACTION_COLUMNS}, project_id from maj.actions
      where org_ref = $1 and id = $2 limit 1`,
    [orgRef, actionId],
  );
  if (!rows[0]) return null;
  return { ...toAction(rows[0]), projectId: String(rows[0].project_id) };
}

function toAction(row: Record<string, unknown>): MajAction {
  return {
    id: String(row.id),
    kind: String(row.kind),
    title: String(row.title),
    why: String(row.why),
    risk: String(row.risk),
    expectedImpact: String(row.expected_impact),
    confidence: Number(row.confidence),
    state: String(row.state) as MajAction["state"],
    evidence: Array.isArray(row.evidence) ? (row.evidence as Record<string, unknown>[]) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    decidedAt: row.decided_at ? new Date(String(row.decided_at)).toISOString() : null,
  };
}

/**
 * Run one analysis: fetch what the configured capabilities allow, store the
 * raw signals with provenance, let the strategist propose, and queue only
 * decisions that are not already open. Usage is booked before every call.
 */
export async function runAnalysis(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  project: MajProject;
  requestId: string;
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
}): Promise<{ proposed: number; signals: number }> {
  const env = input.env ?? process.env;
  const fetchImpl = input.fetchImpl ?? fetch;
  const capabilities = capabilityStatuses(env);
  let overview: WebIntelReport | null = null;
  let keywords: OrganicKeywordsReport | null = null;
  let backlinks: BacklinksReport | null = null;
  let signals = 0;

  if (webintelConfigured(env)) {
    await bookUsage({
      pool: input.pool,
      orgRef: input.orgRef,
      projectId: input.project.id,
      meter: "vendor_units",
      amount: WEBINTEL_DOMAIN_RANKS_UNITS,
      note: "domain_overview",
    });
    overview = await requestDomainOverview({ domain: input.project.domain }, fetchImpl, env);
    await recordSignal({
      pool: input.pool,
      events: input.events,
      orgRef: input.orgRef,
      actorRef: input.actorRef,
      projectId: input.project.id,
      source: "webintel",
      kind: overview.ok ? "domain_overview" : "domain_overview_failed",
      payload: { ...overview },
      requestId: input.requestId,
    });
    signals += 1;

    await bookUsage({
      pool: input.pool,
      orgRef: input.orgRef,
      projectId: input.project.id,
      meter: "vendor_units",
      amount: WEBINTEL_ORGANIC_LINE_UNITS * WEBINTEL_ORGANIC_DEFAULT_LIMIT,
      note: "keywords",
    });
    keywords = await requestOrganicKeywords(
      { domain: input.project.domain, limit: WEBINTEL_ORGANIC_DEFAULT_LIMIT },
      fetchImpl,
      env,
    );
    await recordSignal({
      pool: input.pool,
      events: input.events,
      orgRef: input.orgRef,
      actorRef: input.actorRef,
      projectId: input.project.id,
      source: "webintel",
      kind: keywords.ok ? "keywords" : "keywords_failed",
      payload: { ...keywords },
      requestId: input.requestId,
    });
    signals += 1;

    await bookUsage({
      pool: input.pool,
      orgRef: input.orgRef,
      projectId: input.project.id,
      meter: "vendor_units",
      amount: WEBINTEL_BACKLINKS_UNITS,
      note: "backlinks",
    });
    backlinks = await requestBacklinksOverview({ domain: input.project.domain }, fetchImpl, env);
    await recordSignal({
      pool: input.pool,
      events: input.events,
      orgRef: input.orgRef,
      actorRef: input.actorRef,
      projectId: input.project.id,
      source: "webintel",
      kind: backlinks.ok ? "backlinks" : "backlinks_failed",
      payload: { ...backlinks },
      requestId: input.requestId,
    });
    signals += 1;
  }

  const proposals = ruleStrategist({
    project: input.project,
    overview,
    keywords,
    backlinks,
    capabilities,
  });
  const existing = await listActions(input.pool, input.orgRef, input.project.id);
  const openTitles = new Set(
    existing.filter((action) => action.state !== "declined").map((action) => action.title),
  );

  let proposed = 0;
  for (const proposal of proposals) {
    if (openTitles.has(proposal.title)) continue;
    const id = randomUUID();
    await input.pool.query(
      `insert into maj.actions
         (id, org_ref, project_id, kind, title, why, risk, expected_impact, confidence, evidence)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        input.orgRef,
        input.project.id,
        proposal.kind,
        proposal.title,
        proposal.why,
        proposal.risk,
        proposal.expectedImpact,
        proposal.confidence,
        JSON.stringify(proposal.evidence),
      ],
    );
    await input.pool.query(
      `insert into maj.strategy_proposals
         (id, org_ref, project_id, action_id, strategist, proposal, predicted_impact, chosen)
       values ($1,$2,$3,$4,'rule.v1',$5,$6,true)`,
      [
        randomUUID(),
        input.orgRef,
        input.project.id,
        id,
        JSON.stringify(proposal),
        proposal.confidence,
      ],
    );
    await input.events.publish({
      system: "maj",
      kind: "maj.action.proposed",
      orgRef: input.orgRef,
      actorKind: "system",
      actorRef: input.actorRef,
      subjectRef: `maj:action:${id}`,
      requestId: `${input.requestId}-act-${proposed}`,
      payload: { title: proposal.title, projectId: input.project.id, kind: proposal.kind },
    });
    proposed += 1;
  }

  return { proposed, signals };
}
