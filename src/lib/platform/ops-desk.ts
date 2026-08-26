import { randomUUID } from "node:crypto";
import type pg from "pg";
import { formatSek } from "../ekonomi/money.ts";
import {
  OPS_SMS_KIND_LABEL,
  OPS_SMS_KINDS,
  type OpsLedger,
  type OpsNotice,
  type OpsScope,
  type OpsSmsDesk,
  type OpsSmsKind,
  type OpsSmsRoute,
  type OpsSupport,
  type OpsSupportItem,
} from "./ops-view.ts";
import { normalizeSwedishMobile, sendSms, smsConfigured, type SmsSendResult } from "./sms.ts";

export type OpsDeskFacts = {
  ledger: OpsLedger;
  support: OpsSupport;
  smsFailed: number;
  blockedGates: number;
  databaseDown: boolean;
  vendor: boolean;
};

const emptyLedger = (): OpsLedger => ({
  openCount: 0,
  notDueOre: 0,
  overdueOre: 0,
  overdueCount: 0,
  overdue: [],
});

const emptySupport = (): OpsSupport => ({
  open: 0,
  observations: 0,
  tasks: 0,
  cases: 0,
  intakes: 0,
  items: [],
});

function orgWhere(scope: OpsScope): string {
  return scope === "house" ? "" : " and org_ref = $1";
}

function orgParams(scope: OpsScope, orgRef: string): string[] {
  return scope === "house" ? [] : [orgRef];
}

export async function loadOpsLedger(
  pool: pg.Pool,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsLedger> {
  const where = orgWhere(scope);
  const params = orgParams(scope, orgRef);
  try {
    const [sum, rows] = await Promise.all([
      pool.query<{
        open_count: string;
        not_due_ore: string;
        overdue_ore: string;
        overdue_count: string;
      }>(
        `select
           count(*) filter (where status in ('issued','part_paid'))::text as open_count,
           coalesce(sum(gross_ore - paid_ore) filter (
             where status in ('issued','part_paid') and (due_at is null or due_at >= now())
           ), 0)::text as not_due_ore,
           coalesce(sum(gross_ore - paid_ore) filter (
             where status in ('issued','part_paid') and due_at < now()
           ), 0)::text as overdue_ore,
           count(*) filter (
             where status in ('issued','part_paid') and due_at < now()
           )::text as overdue_count
          from ekonomi.invoices
         where true${where}`,
        params,
      ),
      pool.query<{
        id: string;
        number: string;
        customer_name: string;
        open_ore: string;
        due_at: Date | null;
      }>(
        `select id, number, customer_name, (gross_ore - paid_ore)::text as open_ore, due_at
           from ekonomi.invoices
          where status in ('issued','part_paid')
            and due_at < now()${where}
          order by due_at
          limit 6`,
        params,
      ),
    ]);
    const totals = sum.rows[0];
    return {
      openCount: Number(totals?.open_count ?? 0),
      notDueOre: Number(totals?.not_due_ore ?? 0),
      overdueOre: Number(totals?.overdue_ore ?? 0),
      overdueCount: Number(totals?.overdue_count ?? 0),
      overdue: rows.rows.map((row) => ({
        id: row.id,
        number: row.number,
        customerName: row.customer_name,
        openOre: Number(row.open_ore),
        dueAt: row.due_at ? new Date(row.due_at).toISOString() : null,
        href: `/ekonomi/fakturor/${row.id}`,
      })),
    };
  } catch {
    return emptyLedger();
  }
}

export async function loadOpsSupport(
  pool: pg.Pool,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsSupport> {
  const where = orgWhere(scope);
  const params = orgParams(scope, orgRef);
  const items: OpsSupportItem[] = [];
  let observations = 0;
  let tasks = 0;
  let cases = 0;
  let intakes = 0;

  try {
    const { rows } = await pool.query<{
      id: string;
      title: string;
      severity: string;
      created_at: Date;
    }>(
      `select id, title, severity, created_at
         from britt.observations
        where status = 'open'${where}
        order by created_at desc
        limit 8`,
      params,
    );
    observations = rows.length;
    for (const row of rows) {
      items.push({
        id: row.id,
        kind: "observation",
        title: row.title,
        detail: row.severity === "high" ? "BRITT · hög" : "BRITT",
        href: "/britt",
        at: new Date(row.created_at).toISOString(),
      });
    }
  } catch {
    observations = 0;
  }

  try {
    const { rows } = await pool.query<{
      id: string;
      title: string;
      owner: string;
      created_at: Date;
    }>(
      `select id, title, owner, created_at
         from kansli.tasks
        where done = false${where}
        order by created_at desc
        limit 8`,
      params,
    );
    tasks = rows.length;
    for (const row of rows) {
      items.push({
        id: row.id,
        kind: "task",
        title: row.title,
        detail: row.owner ? `Kansli · ${row.owner}` : "Kansli",
        href: "/kansli",
        at: new Date(row.created_at).toISOString(),
      });
    }
  } catch {
    tasks = 0;
  }

  try {
    const { rows } = await pool.query<{
      id: string;
      case_status: string;
      updated_at: Date;
    }>(
      `select id, case_status, updated_at
         from tyra.tire_cases
        where case_status <> 'DONE'${where}
        order by updated_at desc
        limit 8`,
      params,
    );
    cases = rows.length;
    for (const row of rows) {
      items.push({
        id: row.id,
        kind: "case",
        title: "Däckärende",
        detail: `TYRA · ${row.case_status}`,
        href: `/tyra/cases/${row.id}`,
        at: new Date(row.updated_at).toISOString(),
      });
    }
  } catch {
    cases = 0;
  }

  if (scope === "house") {
    try {
      const { rows } = await pool.query<{
        id: string;
        company_name: string;
        created_at: Date;
      }>(
        `select id, company_name, created_at
           from kansli.intakes
          where provisioned_org_ref is null
          order by created_at desc
          limit 6`,
      );
      intakes = rows.length;
      for (const row of rows) {
        items.push({
          id: row.id,
          kind: "intake",
          title: row.company_name,
          detail: "Ny kund",
          href: `/kansli/upphandling/${row.id}`,
          at: new Date(row.created_at).toISOString(),
        });
      }
    } catch {
      intakes = 0;
    }
  }

  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return {
    open: observations + tasks + cases + intakes,
    observations,
    tasks,
    cases,
    intakes,
    items: items.slice(0, 10),
  };
}

export async function countFailedSms(
  pool: pg.Pool,
  scope: OpsScope,
  orgRef: string,
): Promise<number> {
  const where = orgWhere(scope);
  const params = orgParams(scope, orgRef);
  let sales = 0;
  let alarms = 0;
  try {
    const { rows } = await pool.query<{ n: string }>(
      `select count(*)::text as n
         from ekonomi.sales_alert_outbox
        where status in ('FAILED','BLOCKED')
          and created_at >= now() - interval '7 days'${where}`,
      params,
    );
    sales = Number(rows[0]?.n ?? 0);
  } catch {
    sales = 0;
  }
  try {
    const { rows } = await pool.query<{ n: string }>(
      `select count(*)::text as n
         from platform.alarm_outbox
        where status in ('FAILED','BLOCKED')
          and created_at >= now() - interval '7 days'${where}`,
      params,
    );
    alarms = Number(rows[0]?.n ?? 0);
  } catch {
    alarms = 0;
  }
  return sales + alarms;
}

export function buildOpsNotices(input: {
  facts: OpsDeskFacts;
  routes: OpsSmsRoute[];
}): OpsNotice[] {
  const notices: OpsNotice[] = [];
  const { facts } = input;

  if (facts.databaseDown) {
    notices.push({
      id: "database",
      level: "larm",
      title: "Databasen svarar inte",
      detail: "Ingen mätning kan göras förrän Postgres svarar.",
      href: "/api/platform/health",
      hrefLabel: "Hälsa",
    });
  }
  if (facts.ledger.overdueOre > 0) {
    notices.push({
      id: "overdue",
      level: "larm",
      title: `${formatSek(facts.ledger.overdueOre)} förfallet`,
      detail: `${facts.ledger.overdueCount} ${facts.ledger.overdueCount === 1 ? "faktura" : "fakturor"} i reskontran har gått över tiden.`,
      href: "/ekonomi",
      hrefLabel: "Öppna boken",
    });
  }
  if (facts.support.open > 0) {
    notices.push({
      id: "support",
      level: facts.support.observations > 0 ? "varning" : "info",
      title: `${facts.support.open} öppna ärenden`,
      detail: [
        facts.support.observations ? `${facts.support.observations} i BRITT` : null,
        facts.support.cases ? `${facts.support.cases} i TYRA` : null,
        facts.support.tasks ? `${facts.support.tasks} i Kansli` : null,
        facts.support.intakes ? `${facts.support.intakes} nya kunder` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      href: facts.support.observations ? "/britt" : "/kansli",
      hrefLabel: "Visa ärenden",
    });
  }
  if (facts.smsFailed > 0) {
    notices.push({
      id: "sms_failed",
      level: "varning",
      title: "SMS gick inte fram",
      detail: `${facts.smsFailed} meddelanden är stoppade eller misslyckade de senaste sju dagarna.`,
      href: "/ekonomi",
      hrefLabel: "Sälj-SMS",
    });
  }
  if (facts.blockedGates > 0) {
    notices.push({
      id: "readiness",
      level: "varning",
      title: `${facts.blockedGates} beredskap blockerad`,
      detail: "Första kunden kan inte tas förrän det är löst.",
      href: "/kansli/beredskap",
      hrefLabel: "Beredskap",
    });
  }
  if (!facts.vendor && input.routes.some((route) => route.enabled)) {
    notices.push({
      id: "sms_vendor",
      level: "info",
      title: "Larm är på men telefonen saknas",
      detail: "Numret sparas. SMS går inte ut förrän leverantören är kopplad.",
      href: null,
      hrefLabel: null,
    });
  }
  if (facts.vendor && input.routes.some((route) => route.enabled && !route.phone)) {
    notices.push({
      id: "sms_phone",
      level: "info",
      title: "Larm saknar nummer",
      detail: "Skriv ett svenskt mobilnummer under SMS-rutter.",
      href: null,
      hrefLabel: null,
    });
  }
  return notices;
}

export function alarmActive(kind: OpsSmsKind, facts: OpsDeskFacts): boolean {
  if (kind === "overdue") return facts.ledger.overdueOre > 0;
  if (kind === "support") return facts.support.open > 0;
  if (kind === "sms_failed") return facts.smsFailed > 0;
  return facts.blockedGates > 0;
}

export function alarmSmsBody(kind: OpsSmsKind, facts: OpsDeskFacts): string {
  if (kind === "overdue") {
    return `Larm: förfallen reskontra ${formatSek(facts.ledger.overdueOre)}. Pixdrift Drift.`;
  }
  if (kind === "support") {
    return `Larm: ${facts.support.open} öppna ärenden. Pixdrift Drift.`;
  }
  if (kind === "sms_failed") {
    return `Larm: ${facts.smsFailed} SMS gick inte fram. Pixdrift Drift.`;
  }
  return `Larm: ${facts.blockedGates} beredskap blockerad. Pixdrift Drift.`;
}

async function latestRoutes(pool: pg.Pool, orgRef: string): Promise<OpsSmsRoute[]> {
  const { rows } = await pool.query<{
    kind: OpsSmsKind;
    phone: string;
    enabled: boolean;
    created_at: Date;
  }>(
    `select distinct on (kind) kind, phone, enabled, created_at
       from platform.sms_routes
      where org_ref = $1
      order by kind, created_at desc`,
    [orgRef],
  );
  const found = new Map(rows.map((row) => [row.kind, row]));
  return OPS_SMS_KINDS.map((kind) => {
    const row = found.get(kind);
    return {
      kind,
      phone: row?.phone ?? "",
      enabled: row?.enabled ?? false,
      updatedAt: row ? new Date(row.created_at).toISOString() : new Date(0).toISOString(),
    };
  });
}

export async function loadOpsSmsDesk(
  pool: pg.Pool,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsSmsDesk> {
  const where = orgWhere(scope);
  const params = orgParams(scope, orgRef);
  let routes: OpsSmsRoute[] = OPS_SMS_KINDS.map((kind) => ({
    kind,
    phone: "",
    enabled: false,
    updatedAt: new Date(0).toISOString(),
  }));
  try {
    routes = await latestRoutes(pool, orgRef);
  } catch {
    /* tables may be missing before migrate */
  }

  let salesPhone: string | null = null;
  let salesEnabled = false;
  try {
    const { rows } = await pool.query<{ phone: string; enabled: boolean }>(
      `select phone, enabled from ekonomi.sales_alert_settings where org_ref = $1`,
      [orgRef],
    );
    salesPhone = rows[0]?.phone ?? null;
    salesEnabled = Boolean(rows[0]?.enabled);
  } catch {
    salesPhone = null;
  }

  let outbox: OpsSmsDesk["outbox"] = [];
  try {
    const { rows } = await pool.query<{
      id: string;
      kind: string;
      status: string;
      body: string;
      last_error: string | null;
      created_at: Date;
    }>(
      `select id, kind, status, body, last_error, created_at
         from platform.alarm_outbox
        where true${where}
        order by created_at desc
        limit 8`,
      params,
    );
    outbox = rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      body: row.body,
      lastError: row.last_error,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  } catch {
    outbox = [];
  }

  const phone = routes.find((route) => route.phone)?.phone ?? "";
  return {
    vendor: smsConfigured(),
    phone,
    routes,
    salesPhone,
    salesEnabled,
    outbox,
  };
}

export async function saveOpsSmsRoutes(input: {
  pool: pg.Pool;
  orgRef: string;
  phone: string;
  enabled: readonly OpsSmsKind[];
}): Promise<OpsSmsRoute[]> {
  const phone = normalizeSwedishMobile(input.phone);
  if (!phone) throw new Error("Skriv ett svenskt mobilnummer, till exempel 070-123 45 67.");
  const on = new Set(input.enabled);
  for (const kind of OPS_SMS_KINDS) {
    await input.pool.query(
      `insert into platform.sms_routes (id, org_ref, kind, phone, enabled)
       values ($1,$2,$3,$4,$5)`,
      [randomUUID(), input.orgRef, kind, phone, on.has(kind)],
    );
  }
  return latestRoutes(input.pool, input.orgRef);
}

async function latestState(
  pool: pg.Pool,
  orgRef: string,
  kind: OpsSmsKind,
): Promise<boolean | null> {
  const { rows } = await pool.query<{ active: boolean }>(
    `select active from platform.alarm_states
      where org_ref = $1 and kind = $2
      order by created_at desc
      limit 1`,
    [orgRef, kind],
  );
  return rows[0] ? rows[0].active : null;
}

export async function raiseOpsAlarms(input: {
  pool: pg.Pool;
  orgRef: string;
  facts: OpsDeskFacts;
  routes: OpsSmsRoute[];
  deliver: boolean;
  send?: (payload: { to: string; body: string }) => Promise<SmsSendResult>;
}): Promise<{ sent: number; skipped: number; blocked: number }> {
  if (!input.deliver) return { sent: 0, skipped: 0, blocked: 0 };
  const send = input.send ?? sendSms;
  let sent = 0;
  let skipped = 0;
  let blocked = 0;

  for (const kind of OPS_SMS_KINDS) {
    const active = alarmActive(kind, input.facts);
    const previous = await latestState(input.pool, input.orgRef, kind);
    if (active === previous) {
      skipped += 1;
      continue;
    }
    await input.pool.query(
      `insert into platform.alarm_states (id, org_ref, kind, active) values ($1,$2,$3,$4)`,
      [randomUUID(), input.orgRef, kind, active],
    );
    if (!active) {
      skipped += 1;
      continue;
    }
    const route = input.routes.find((item) => item.kind === kind);
    if (!route?.enabled || !route.phone) {
      skipped += 1;
      continue;
    }
    const body = alarmSmsBody(kind, input.facts);
    const delivered = input.facts.vendor
      ? await send({ to: route.phone, body })
      : {
          ok: false,
          providerRef: null,
          reason: "Ingen telefonleverantör är kopplad. Meddelandet skickas inte.",
        };
    const status = delivered.ok ? "SENT" : input.facts.vendor ? "FAILED" : "BLOCKED";
    await input.pool.query(
      `insert into platform.alarm_outbox
         (id, org_ref, kind, recipient, body, status, last_error, provider_ref)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        randomUUID(),
        input.orgRef,
        kind,
        route.phone,
        body,
        status,
        delivered.reason,
        delivered.providerRef,
      ],
    );
    if (status === "SENT") sent += 1;
    else blocked += 1;
  }
  return { sent, skipped, blocked };
}

export async function loadOpsDesk(
  pool: pg.Pool,
  input: {
    orgRef: string;
    scope: OpsScope;
    blockedGates: number;
    databaseDown: boolean;
  },
): Promise<{
  facts: OpsDeskFacts;
  notices: OpsNotice[];
  ledger: OpsLedger;
  support: OpsSupport;
  sms: OpsSmsDesk;
}> {
  const [ledger, support, smsFailed, sms] = await Promise.all([
    loadOpsLedger(pool, input.scope, input.orgRef),
    loadOpsSupport(pool, input.scope, input.orgRef),
    countFailedSms(pool, input.scope, input.orgRef),
    loadOpsSmsDesk(pool, input.scope, input.orgRef),
  ]);
  const facts: OpsDeskFacts = {
    ledger,
    support,
    smsFailed,
    blockedGates: input.blockedGates,
    databaseDown: input.databaseDown,
    vendor: sms.vendor,
  };
  return {
    facts,
    notices: buildOpsNotices({ facts, routes: sms.routes }),
    ledger,
    support,
    sms,
  };
}

export { OPS_SMS_KIND_LABEL, OPS_SMS_KINDS };
