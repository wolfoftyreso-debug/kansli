import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { readConnectorSecret } from "./connectors.ts";
import { remainingOre, listInvoices } from "./invoices.ts";
import { matchInbound, type InboundTransfer } from "./match.ts";
import { recordReceivedPayment } from "./payments.ts";

const BUSINESS_LIVE = "https://b2b.revolut.com/api/1.0";
const BUSINESS_SANDBOX = "https://sandbox-b2b.revolut.com/api/1.0";

export interface RevolutTransaction {
  id: string;
  type: string;
  state: string;
  created_at?: string;
  completed_at?: string;
  reference?: string;
  legs?: Array<{ amount: number; currency: string; description?: string }>;
}

export function revolutBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.REVOLUT_BUSINESS_SANDBOX === "true" ? BUSINESS_SANDBOX : BUSINESS_LIVE;
}

export function toInbound(tx: RevolutTransaction): InboundTransfer | null {
  const leg = tx.legs?.find((item) => item.amount > 0);
  if (!leg || tx.state !== "completed") return null;
  return {
    providerTxId: tx.id,
    amountOre: Math.round(leg.amount * 100),
    currency: leg.currency,
    reference: tx.reference ?? leg.description ?? null,
    bookedAt: tx.completed_at ?? tx.created_at ?? new Date().toISOString(),
  };
}

export async function fetchRevolutTransactions(
  token: string,
  baseUrl = revolutBaseUrl(),
): Promise<RevolutTransaction[]> {
  const to = new Date();
  const from = new Date(to.getTime() - 14 * 86_400_000);
  const url = new URL(`${baseUrl}/transactions`);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());
  url.searchParams.set("count", "100");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Revolut ${response.status}. Tokenen avvisades eller API:t är otillgängligt.`);
  }
  return (await response.json()) as RevolutTransaction[];
}

export async function syncRevolut(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  requestId: string;
  fetchTx?: (token: string) => Promise<RevolutTransaction[]>;
}): Promise<{
  fetched: number;
  matched: number;
  ambiguous: number;
  blocked: boolean;
  detail: string;
}> {
  const token = await readConnectorSecret(input.pool, input.orgRef, "revolut_business");
  if (!token) {
    await input.events.publish({
      system: "ekonomi",
      kind: "ekonomi.revolut.sync.blocked",
      orgRef: input.orgRef,
      actorKind: "user",
      actorRef: input.actorRef,
      subjectRef: "ekonomi:connector:revolut_business",
      requestId: input.requestId,
      payload: { title: "Revolut-synk blockerad", reason: "no_token" },
    });
    return {
      fetched: 0,
      matched: 0,
      ambiguous: 0,
      blocked: true,
      detail: "Ingen REVOLUT_BUSINESS_TOKEN och ingen sparad token i slottet.",
    };
  }

  const raw = await (input.fetchTx ?? fetchRevolutTransactions)(token);
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
    await input.pool.query(
      `insert into ekonomi.inbound_transfers
         (id, org_ref, provider, provider_tx_id, amount_ore, currency, reference, booked_at, raw)
       values ($1,$2,'revolut',$3,$4,$5,$6,$7,$8::jsonb)
       on conflict (org_ref, provider, provider_tx_id) do nothing`,
      [
        crypto.randomUUID(),
        input.orgRef,
        inbound.providerTxId,
        inbound.amountOre,
        inbound.currency,
        inbound.reference,
        inbound.bookedAt,
        JSON.stringify(tx),
      ],
    );
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
