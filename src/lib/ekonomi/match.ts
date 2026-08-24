/** Deterministic matching. Never guesses when two invoices fit. */

export interface MatchCandidate {
  invoiceId: string;
  number: string;
  remainingOre: number;
  currency: string;
}

export interface InboundTransfer {
  providerTxId: string;
  amountOre: number;
  currency: string;
  reference: string | null;
  bookedAt: string;
}

export type MatchResult =
  | { status: "matched"; invoiceId: string }
  | { status: "ambiguous"; invoiceIds: string[] }
  | { status: "unmatched" };

export function matchInbound(transfer: InboundTransfer, open: MatchCandidate[]): MatchResult {
  if (transfer.amountOre <= 0) return { status: "unmatched" };
  const sameMoney = open.filter(
    (invoice) =>
      invoice.remainingOre === transfer.amountOre && invoice.currency === transfer.currency,
  );
  if (sameMoney.length === 0) return { status: "unmatched" };

  const ref = (transfer.reference ?? "").toUpperCase();
  const byRef = sameMoney.filter((invoice) => {
    const number = invoice.number.toUpperCase();
    if (number.length >= 6 && ref.includes(number)) return true;
    return invoice.invoiceId.length >= 32 && ref.includes(invoice.invoiceId.toUpperCase());
  });
  const pool = byRef.length > 0 ? byRef : sameMoney;
  if (pool.length === 1) return { status: "matched", invoiceId: pool[0]!.invoiceId };
  return { status: "ambiguous", invoiceIds: pool.map((invoice) => invoice.invoiceId) };
}
