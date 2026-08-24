import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { readConnectorSecret } from "./connectors.ts";
import { remainingOre, listInvoices } from "./invoices.ts";
import { matchInbound, type InboundTransfer } from "./match.ts";
import { recordReceivedPayment } from "./payments.ts";
import { revolutApiBase, revolutEnvironment } from "./revolut/config.ts";
import { getValidAccessToken, ReauthorizationRequired } from "./revolut/tokens.ts";

export interface RevolutTransaction {
  id: string;
  type: string;
  state: string;
  created_at?: string;
  completed_at?: string;
  reference?: string;
  legs?: Array<{ amount: number; currency: string; description?: string }>;
}

export interface RevolutAccount {
  id: string;
  name?: string;
  balance: number;
  currency: string;
  state?: string;
}

export interface StatementLine {
  id: string;
  type: string;
  state: string;
  amountOre: number;
  currency: string;
  reference: string | null;
  bookedAt: string;
  direction: "in" | "out" | "zero";
}

export interface RevolutStatement {
  hasToken: boolean;
  source: "revolut" | "stored" | "none";
  /** Where the credential came from. `oauth` renews itself. */
  tokenSource: TokenSource;
  reauthorize: boolean;
  accounts: RevolutAccount[];
  lines: StatementLine[];
  error: string | null;
}

/** Endpoints live in one module now. This keeps the old call sites working. */
export function revolutBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return revolutApiBase(env);
}

export type TokenSource = "oauth" | "manual" | "none";

export interface ResolvedToken {
  token: string | null;
  source: TokenSource;
  /** True when the OAuth grant is dead and only a human reconnect will fix it. */
  reauthorize: boolean;
}

/**
 * The credential every Revolut read goes through.
 *
 * The OAuth connection comes first because it renews itself. The manually
 * pasted Business token stays as a fallback so the account statement keeps
 * working while the owner is still registering the certificate.
 */
export async function resolveRevolutAccessToken(input: {
  pool: pg.Pool;
  orgRef: string;
  events?: EventLog | null;
  actorRef?: string | null;
  requestId?: string | null;
}): Promise<ResolvedToken> {
  let reauthorize = false;
  try {
    const token = await getValidAccessToken({
      pool: input.pool,
      orgRef: input.orgRef,
      environment: revolutEnvironment(),
      events: input.events ?? null,
      actorRef: input.actorRef ?? null,
      requestId: input.requestId ?? null,
    });
    return { token, source: "oauth", reauthorize: false };
  } catch (error) {
    // "Not connected yet" is expected. A dead grant is worth surfacing.
    if (error instanceof ReauthorizationRequired) {
      reauthorize = error.code !== "not_configured";
    }
  }
  const manual = await readConnectorSecret(input.pool, input.orgRef, "revolut_business");
  if (manual) return { token: manual, source: "manual", reauthorize };
  return { token: null, source: "none", reauthorize };
}

export function toStatementLine(tx: RevolutTransaction): StatementLine | null {
  const leg = tx.legs?.find((item) => item.amount !== 0) ?? tx.legs?.[0];
  if (!leg) return null;
  const amountOre = Math.round(leg.amount * 100);
  return {
    id: tx.id,
    type: tx.type,
    state: tx.state,
    amountOre,
    currency: leg.currency,
    reference: tx.reference ?? leg.description ?? null,
    bookedAt: tx.completed_at ?? tx.created_at ?? "",
    direction: amountOre < 0 ? "out" : amountOre > 0 ? "in" : "zero",
  };
}

export function toInbound(tx: RevolutTransaction): InboundTransfer | null {
  if (tx.state !== "completed") return null;
  const line = toStatementLine(tx);
  if (!line || line.amountOre <= 0) return null;
  return {
    providerTxId: line.id,
    amountOre: line.amountOre,
    currency: line.currency,
    reference: line.reference,
    bookedAt: line.bookedAt || new Date().toISOString(),
  };
}

async function revolutGet<T>(
  token: string,
  path: string,
  query: Record<string, string> = {},
  baseUrl = revolutBaseUrl(),
): Promise<T> {
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Revolut ${response.status}. Tokenen avvisades eller API:t är otillgängligt.`);
  }
  return (await response.json()) as T;
}

export async function fetchRevolutAccounts(
  token: string,
  baseUrl = revolutBaseUrl(),
): Promise<RevolutAccount[]> {
  return revolutGet<RevolutAccount[]>(token, "/accounts", {}, baseUrl);
}

export async function fetchRevolutTransactions(
  token: string,
  baseUrl = revolutBaseUrl(),
): Promise<RevolutTransaction[]> {
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 86_400_000);
  return revolutGet<RevolutTransaction[]>(
    token,
    "/transactions",
    { from: from.toISOString(), to: to.toISOString(), count: "1000" },
    baseUrl,
  );
}

export function statementFromTransactions(raw: RevolutTransaction[]): StatementLine[] {
  return raw
    .map(toStatementLine)
    .filter((line): line is StatementLine => Boolean(line))
    .sort((a, b) => (a.bookedAt < b.bookedAt ? 1 : a.bookedAt > b.bookedAt ? -1 : 0));
}

async function persistStatementLines(
  pool: pg.Pool,
  orgRef: string,
  raw: RevolutTransaction[],
): Promise<void> {
  for (const tx of raw) {
    const line = toStatementLine(tx);
    if (!line) continue;
    await pool.query(
      `insert into ekonomi.inbound_transfers
         (id, org_ref, provider, provider_tx_id, amount_ore, currency, reference, booked_at, raw)
       values ($1,$2,'revolut',$3,$4,$5,$6,$7,$8::jsonb)
       on conflict (org_ref, provider, provider_tx_id) do update
         set amount_ore = excluded.amount_ore,
             currency = excluded.currency,
             reference = excluded.reference,
             booked_at = excluded.booked_at,
             raw = excluded.raw
       where ekonomi.inbound_transfers.match_status = 'unmatched'`,
      [
        crypto.randomUUID(),
        orgRef,
        line.id,
        line.amountOre,
        line.currency,
        line.reference,
        line.bookedAt || null,
        JSON.stringify(tx),
      ],
    );
  }
}

export async function listStoredStatement(pool: pg.Pool, orgRef: string): Promise<StatementLine[]> {
  const { rows } = await pool.query<{ raw: RevolutTransaction }>(
    `select raw from ekonomi.inbound_transfers
      where org_ref = $1 and provider = 'revolut'
      order by booked_at desc nulls last`,
    [orgRef],
  );
  return statementFromTransactions(rows.map((row) => row.raw));
}

export async function loadRevolutStatement(input: {
  pool: pg.Pool;
  orgRef: string;
  events?: EventLog | null;
  fetchAccounts?: (token: string) => Promise<RevolutAccount[]>;
  fetchTx?: (token: string) => Promise<RevolutTransaction[]>;
  resolveToken?: (input: { pool: pg.Pool; orgRef: string }) => Promise<ResolvedToken>;
}): Promise<RevolutStatement> {
  const resolved = await (input.resolveToken ?? resolveRevolutAccessToken)({
    pool: input.pool,
    orgRef: input.orgRef,
    events: input.events ?? null,
  });
  const stored = await listStoredStatement(input.pool, input.orgRef);
  if (!resolved.token) {
    return {
      hasToken: false,
      source: stored.length > 0 ? "stored" : "none",
      tokenSource: resolved.source,
      reauthorize: resolved.reauthorize,
      accounts: [],
      lines: stored,
      error: null,
    };
  }
  try {
    const [accounts, raw] = await Promise.all([
      (input.fetchAccounts ?? fetchRevolutAccounts)(resolved.token),
      (input.fetchTx ?? fetchRevolutTransactions)(resolved.token),
    ]);
    await persistStatementLines(input.pool, input.orgRef, raw);
    return {
      hasToken: true,
      source: "revolut",
      tokenSource: resolved.source,
      reauthorize: false,
      accounts,
      lines: statementFromTransactions(raw),
      error: null,
    };
  } catch (error) {
    return {
      hasToken: true,
      source: stored.length > 0 ? "stored" : "none",
      tokenSource: resolved.source,
      reauthorize: resolved.reauthorize,
      accounts: [],
      lines: stored,
      error: error instanceof Error ? error.message : "Revolut svarade inte.",
    };
  }
}

export async function syncRevolut(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  requestId: string;
  fetchTx?: (token: string) => Promise<RevolutTransaction[]>;
  resolveToken?: (input: { pool: pg.Pool; orgRef: string }) => Promise<ResolvedToken>;
}): Promise<{
  fetched: number;
  matched: number;
  ambiguous: number;
  blocked: boolean;
  detail: string;
}> {
  const resolved = await (input.resolveToken ?? resolveRevolutAccessToken)({
    pool: input.pool,
    orgRef: input.orgRef,
    events: input.events,
    actorRef: input.actorRef,
    requestId: input.requestId,
  });
  const token = resolved.token;
  if (!token) {
    await input.events.publish({
      system: "ekonomi",
      kind: "ekonomi.revolut.sync.blocked",
      orgRef: input.orgRef,
      actorKind: "user",
      actorRef: input.actorRef,
      subjectRef: "ekonomi:connector:revolut_business",
      requestId: input.requestId,
      payload: {
        title: "Revolut-synk blockerad",
        reason: resolved.reauthorize ? "reauthorization_required" : "no_token",
      },
    });
    return {
      fetched: 0,
      matched: 0,
      ambiguous: 0,
      blocked: true,
      detail: resolved.reauthorize
        ? "Revolut-anslutningen måste göras om. Tryck Anslut om på Anslutningar."
        : "Ingen ansluten Revolut-behörighet och ingen sparad token i slottet.",
    };
  }

  const raw = await (input.fetchTx ?? fetchRevolutTransactions)(token);
  await persistStatementLines(input.pool, input.orgRef, raw);
  const open = (await listInvoices(input.pool, input.orgRef))
    .filter((invoice) => invoice.status === "issued" || invoice.status === "part_paid")
    .map((invoice) => ({
      invoiceId: invoice.id,
      number: invoice.number,
      remainingOre: remainingOre(invoice),
      currency: invoice.currency,
    }));

  let matched = 0;
  let ambiguous = 0;
  for (const tx of raw) {
    const inbound = toInbound(tx);
    if (!inbound) continue;
    const verdict = matchInbound(inbound, open);
    if (verdict.status === "matched") {
      await recordReceivedPayment({
        pool: input.pool,
        events: input.events,
        orgRef: input.orgRef,
        actorRef: input.actorRef,
        invoiceId: verdict.invoiceId,
        rail: "revolut",
        amountOre: inbound.amountOre,
        externalRef: inbound.providerTxId,
        requestId: `${input.requestId}:${inbound.providerTxId}`,
      });
      await input.pool.query(
        `update ekonomi.inbound_transfers
            set match_status = 'matched'
          where org_ref = $1 and provider = 'revolut' and provider_tx_id = $2`,
        [input.orgRef, inbound.providerTxId],
      );
      await input.events.publish({
        system: "ekonomi",
        kind: "ekonomi.payment.matched",
        orgRef: input.orgRef,
        actorKind: "system",
        actorRef: input.actorRef,
        subjectRef: `ekonomi:invoice:${verdict.invoiceId}`,
        requestId: `${input.requestId}:${inbound.providerTxId}`,
        payload: { title: inbound.providerTxId, invoiceId: verdict.invoiceId },
      });
      matched += 1;
    } else if (verdict.status === "ambiguous") {
      await input.pool.query(
        `update ekonomi.inbound_transfers
            set match_status = 'ambiguous'
          where org_ref = $1 and provider = 'revolut' and provider_tx_id = $2`,
        [input.orgRef, inbound.providerTxId],
      );
      ambiguous += 1;
    }
  }

  return {
    fetched: raw.length,
    matched,
    ambiguous,
    blocked: false,
    detail: `${raw.length} hämtade, ${matched} matchade, ${ambiguous} tvetydiga.`,
  };
}
