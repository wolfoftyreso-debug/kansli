import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { readConnectorSecret } from "./connectors.ts";
import { remainingOre, listInvoices } from "./invoices.ts";
import { matchInbound, type InboundTransfer } from "./match.ts";
import { recordReceivedPayment } from "./payments.ts";
import { RevolutClient } from "./revolut/client.ts";
import { revolutApiBase, revolutEnvironment } from "./revolut/config.ts";
import { RevolutError } from "./revolut/errors.ts";
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

/**
 * What business code is handed instead of a bare token: reads only, and the
 * authentication has already been dealt with underneath.
 */
export interface RevolutReader {
  source: Exclude<TokenSource, "none">;
  accounts(): Promise<RevolutAccount[]>;
  transactions(): Promise<RevolutTransaction[]>;
}

export interface OpenedReader {
  reader: RevolutReader | null;
  /** True when the OAuth grant is dead and only a human reconnect will fix it. */
  reauthorize: boolean;
  /** Set when a credential exists but could not be renewed right now. */
  errorCode: string | null;
}

export interface ReaderInput {
  pool: pg.Pool;
  orgRef: string;
  events?: EventLog | null;
  actorRef?: string | null;
  requestId?: string | null;
}

/**
 * The one place a Revolut credential is chosen.
 *
 * The OAuth connection comes first because it renews itself, and it is handed
 * out as a `RevolutClient` so the timeout and the single 401-refresh-retry
 * apply to every read. The manually pasted Business token stays as a fallback
 * so the account statement keeps working while the owner is still registering
 * the certificate.
 */
export async function openRevolutReader(input: ReaderInput): Promise<OpenedReader> {
  let reauthorize = false;
  let errorCode: string | null = null;
  try {
    // Probing the token here is what surfaces a dead grant before any read, and
    // renews a token that is inside the safety margin.
    await getValidAccessToken({
      pool: input.pool,
      orgRef: input.orgRef,
      environment: revolutEnvironment(),
      events: input.events ?? null,
      actorRef: input.actorRef ?? null,
      requestId: input.requestId ?? null,
    });
    const client = new RevolutClient({
      pool: input.pool,
      orgRef: input.orgRef,
      environment: revolutEnvironment(),
      events: input.events ?? null,
      actorRef: input.actorRef ?? null,
      requestId: input.requestId ?? null,
    });
    return {
      reader: {
        source: "oauth",
        accounts: () => client.accounts(),
        transactions: () => client.transactions(ninetyDays()),
      },
      reauthorize: false,
      errorCode: null,
    };
  } catch (error) {
    // "Not connected yet" is expected. A dead grant is worth surfacing.
    if (error instanceof ReauthorizationRequired) {
      reauthorize = error.code !== "not_configured";
      errorCode = reauthorize ? error.code : null;
    } else if (error instanceof RevolutError) {
      errorCode = error.category;
    } else {
      errorCode = "unknown";
    }
  }
  const manual = await readConnectorSecret(input.pool, input.orgRef, "revolut_business");
  if (manual) {
    return {
      reader: {
        source: "manual",
        accounts: () => fetchRevolutAccounts(manual),
        transactions: () => fetchRevolutTransactions(manual),
      },
      reauthorize,
      errorCode,
    };
  }
  return { reader: null, reauthorize, errorCode };
}

function ninetyDays(): { from: Date; to: Date } {
  const to = new Date();
  return { from: new Date(to.getTime() - 90 * 86_400_000), to };
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

/** The manually pasted token has no renewal to lean on, but it still may not hang. */
export const LEGACY_REQUEST_TIMEOUT_MS = 20_000;

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
    signal: AbortSignal.timeout(LEGACY_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `Revolut svarade ${response.status}. Nyckeln godkändes inte, eller så svarar Revolut inte just nu.`,
    );
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
  /** Test seams. Production always goes through `openRevolutReader`. */
  openReader?: (input: ReaderInput) => Promise<OpenedReader>;
  fetchAccounts?: () => Promise<RevolutAccount[]>;
  fetchTx?: () => Promise<RevolutTransaction[]>;
}): Promise<RevolutStatement> {
  const opened = await (input.openReader ?? openRevolutReader)({
    pool: input.pool,
    orgRef: input.orgRef,
    events: input.events ?? null,
  });
  const stored = await listStoredStatement(input.pool, input.orgRef);
  if (!opened.reader) {
    return {
      hasToken: false,
      source: stored.length > 0 ? "stored" : "none",
      tokenSource: "none",
      reauthorize: opened.reauthorize,
      accounts: [],
      lines: stored,
      error: null,
    };
  }
  const reader = opened.reader;
  try {
    const [accounts, raw] = await Promise.all([
      (input.fetchAccounts ?? (() => reader.accounts()))(),
      (input.fetchTx ?? (() => reader.transactions()))(),
    ]);
    await persistStatementLines(input.pool, input.orgRef, raw);
    return {
      hasToken: true,
      source: "revolut",
      tokenSource: reader.source,
      reauthorize: false,
      accounts,
      lines: statementFromTransactions(raw),
      error: null,
    };
  } catch (error) {
    return {
      hasToken: true,
      source: stored.length > 0 ? "stored" : "none",
      tokenSource: reader.source,
      reauthorize: opened.reauthorize,
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
  fetchTx?: () => Promise<RevolutTransaction[]>;
  openReader?: (input: ReaderInput) => Promise<OpenedReader>;
}): Promise<{
  fetched: number;
  matched: number;
  ambiguous: number;
  blocked: boolean;
  detail: string;
}> {
  const opened = await (input.openReader ?? openRevolutReader)({
    pool: input.pool,
    orgRef: input.orgRef,
    events: input.events,
    actorRef: input.actorRef,
    requestId: input.requestId,
  });
  if (!opened.reader) {
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
        reason: opened.reauthorize ? "reauthorization_required" : "no_token",
      },
    });
    return {
      fetched: 0,
      matched: 0,
      ambiguous: 0,
      blocked: true,
      detail: opened.reauthorize
        ? "Revolut-anslutningen måste göras om. Tryck Anslut om på Anslutningar."
        : "Revolut är inte anslutet och ingen nyckel är sparad. Anslut under Anslutningar.",
    };
  }

  const reader = opened.reader;
  const raw = await (input.fetchTx ?? (() => reader.transactions()))();
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
