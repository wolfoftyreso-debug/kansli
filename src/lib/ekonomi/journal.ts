import { createHash, randomUUID } from "node:crypto";
import type pg from "pg";
import { getAccount } from "./chart.ts";
import { assertOre } from "./money.ts";

export interface JournalLine {
  account: string;
  debitOre: number;
  creditOre: number;
}

export interface PostedTransaction {
  id: string;
  hash: string;
  prevHash: string;
  template: string;
  description: string;
}

export function assertBalanced(lines: JournalLine[]): void {
  if (lines.length === 0) throw new Error("verifikat utan rader.");
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    getAccount(line.account);
    assertOre(line.debitOre, "debet");
    assertOre(line.creditOre, "kredit");
    if (line.debitOre > 0 && line.creditOre > 0) {
      throw new Error(`konto ${line.account} har både debet och kredit.`);
    }
    if (line.debitOre === 0 && line.creditOre === 0) {
      throw new Error(`konto ${line.account} är tomt.`);
    }
    debit += line.debitOre;
    credit += line.creditOre;
  }
  if (debit !== credit) {
    throw new Error(`verifikat i obalans: debet ${debit} kredit ${credit}.`);
  }
  if (debit === 0) throw new Error("verifikat summerar till noll.");
}

export function canonicalJournal(lines: JournalLine[]): string {
  return JSON.stringify(
    lines.map((line) => ({
      account: line.account,
      debit_ore: line.debitOre,
      credit_ore: line.creditOre,
    })),
  );
}

export function hashJournal(prevHash: string, lines: JournalLine[]): string {
  return createHash("sha256").update(prevHash).update(canonicalJournal(lines)).digest("hex");
}

export async function postJournal(input: {
  pool: pg.Pool;
  orgRef: string;
  template: string;
  description: string;
  lines: JournalLine[];
  sourceSystem?: string | null;
  sourceRef?: string | null;
}): Promise<PostedTransaction> {
  assertBalanced(input.lines);
  const client = await input.pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into ekonomi.journals (org_ref) values ($1) on conflict do nothing`,
      [input.orgRef],
    );
    const prev = await client.query<{ hash: string }>(
      `select hash from ekonomi.transactions
        where org_ref = $1 order by created_at desc, id desc limit 1`,
      [input.orgRef],
    );
    const prevHash = prev.rows[0]?.hash ?? "0".repeat(64);
    const hash = hashJournal(prevHash, input.lines);
    const id = randomUUID();
    await client.query(
      `insert into ekonomi.transactions
         (id, org_ref, template, description, hash, prev_hash, source_system, source_ref)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        input.orgRef,
        input.template,
        input.description,
        hash,
        prevHash,
        input.sourceSystem ?? null,
        input.sourceRef ?? null,
      ],
    );
    for (const line of input.lines) {
      await client.query(
        `insert into ekonomi.entries
           (id, org_ref, transaction_id, account_code, debit_ore, credit_ore)
         values ($1,$2,$3,$4,$5,$6)`,
        [randomUUID(), input.orgRef, id, line.account, line.debitOre, line.creditOre],
      );
    }
    await client.query("commit");
    return { id, hash, prevHash, template: input.template, description: input.description };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listTransactions(
  pool: pg.Pool,
  orgRef: string,
  limit = 50,
): Promise<
  Array<{
    id: string;
    template: string;
    description: string;
    hash: string;
    createdAt: string;
  }>
> {
  const { rows } = await pool.query(
    `select id, template, description, hash, created_at
       from ekonomi.transactions
      where org_ref = $1
      order by created_at desc
      limit $2`,
    [orgRef, limit],
  );
  return rows.map((row) => ({
    id: row.id,
    template: row.template,
    description: row.description,
    hash: row.hash,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function getTransactionEntries(
  pool: pg.Pool,
  orgRef: string,
  transactionId: string,
): Promise<JournalLine[]> {
  const { rows } = await pool.query(
    `select account_code, debit_ore, credit_ore
       from ekonomi.entries
      where org_ref = $1 and transaction_id = $2
      order by account_code`,
    [orgRef, transactionId],
  );
  return rows.map((row) => ({
    account: row.account_code,
    debitOre: Number(row.debit_ore),
    creditOre: Number(row.credit_ore),
  }));
}

export async function accountBalance(
  pool: pg.Pool,
  orgRef: string,
  account: string,
): Promise<number> {
  getAccount(account);
  const { rows } = await pool.query<{ n: string }>(
    `select coalesce(sum(debit_ore) - sum(credit_ore), 0)::text as n
       from ekonomi.entries
      where org_ref = $1 and account_code = $2`,
    [orgRef, account],
  );
  return Number(rows[0]?.n ?? 0);
}
