import { createHash, randomBytes, randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import {
  ACKNOWLEDGEMENT_DECLARATION,
  DEFAULT_CLAUSES,
  parseClauses,
  type AgreementClause,
} from "./clauses.ts";

export interface Agreement {
  id: string;
  title: string;
  counterparty: string;
  status: string;
  body: string;
  clauses: AgreementClause[];
  createdAt: string;
  signedAt: string | null;
  signerName: string | null;
  artifactSha256: string | null;
  magicLink?: string;
}

export function hashIrmaToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function irmaLinkPath(token: string): string {
  return `/irma/l/${token}`;
}

export function artifactPayload(input: {
  id: string;
  title: string;
  counterparty: string;
  clauses: AgreementClause[];
  signerName: string;
  signedAt: string;
  declaration: string;
}): string {
  return JSON.stringify({
    id: input.id,
    title: input.title,
    counterparty: input.counterparty,
    clauses: input.clauses,
    signerName: input.signerName,
    signedAt: input.signedAt,
    declaration: input.declaration,
  });
}

export function hashArtifact(canonical: string): string {
  return createHash("sha256").update(canonical).digest("hex");
}

export function hashSignature(input: {
  agreementId: string;
  signerName: string;
  declaration: string;
  signedAt: string;
}): string {
  return createHash("sha256")
    .update(`${input.agreementId}\n${input.signerName}\n${input.declaration}\n${input.signedAt}`)
    .digest("hex");
}

const AGREEMENT_COLUMNS = `id, title, counterparty, status, body, clauses, created_at,
       signed_at, signer_name, artifact_sha256`;
const AGREEMENT_BY_TOKEN = `id, org_ref, title, counterparty, status, body, clauses, created_at,
       signed_at, signer_name, artifact_sha256`;

export async function listAgreements(pool: pg.Pool, orgRef: string): Promise<Agreement[]> {
  const { rows } = await pool.query(
    `select ${AGREEMENT_COLUMNS} from irma.agreements
      where org_ref = $1 order by created_at desc`,
    [orgRef],
  );
  return rows.map(toAgreement);
}

export async function createAgreement(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  title: string;
  counterparty: string;
  requestId: string;
  body?: string;
  clauses?: AgreementClause[];
}): Promise<Agreement> {
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashIrmaToken(token);
  const title = input.title.trim();
  const counterparty = input.counterparty.trim();
  const body = (input.body ?? "").trim();
  const clauses = input.clauses?.length ? input.clauses : [...DEFAULT_CLAUSES];
  await input.pool.query(
    `insert into irma.agreements
       (id, org_ref, title, counterparty, status, token_hash, body, clauses)
     values ($1,$2,$3,$4,'draft',$5,$6,$7::jsonb)`,
    [id, input.orgRef, title, counterparty, tokenHash, body, JSON.stringify(clauses)],
  );
  await input.events.publish({
    system: "irma",
    kind: "irma.agreement.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `irma:agreement:${id}`,
    requestId: input.requestId,
    payload: { title },
  });
  return {
    id,
    title,
    counterparty,
    status: "draft",
    body,
    clauses,
    createdAt: new Date().toISOString(),
    signedAt: null,
    signerName: null,
    artifactSha256: null,
    magicLink: irmaLinkPath(token),
  };
}

/**
 * Counterparty opens the hashed token. First successful open moves draft → viewed
 * and publishes. The token itself is never stored.
 */
export async function openAgreementByToken(input: {
  pool: pg.Pool;
  events: EventLog;
  token: string;
  requestId: string;
}): Promise<Agreement | null> {
  const row = await loadByToken(input.pool, input.token);
  if (!row) return null;

  if (row.status === "draft") {
    await input.pool.query(`update irma.agreements set status = 'viewed' where id = $1`, [row.id]);
    row.status = "viewed";
    await input.events.publish({
      system: "irma",
      kind: "irma.agreement.viewed",
      orgRef: row.org_ref,
      actorKind: "system",
      subjectRef: `irma:agreement:${row.id}`,
      requestId: input.requestId,
      payload: { title: row.title },
    });
  }

  return toAgreement(row);
}

export async function acknowledgeAgreement(input: {
  pool: pg.Pool;
  events: EventLog;
  token: string;
  signerName: string;
  requestId: string;
  declaration?: string;
}): Promise<Agreement | null> {
  const signerName = input.signerName.trim();
  if (!signerName) return null;
  const row = await loadByToken(input.pool, input.token);
  if (!row) return null;
  if (row.status === "signed") return toAgreement(row);

  const signedAt = new Date().toISOString();
  const declaration = input.declaration?.trim() || ACKNOWLEDGEMENT_DECLARATION;
  const clauses = parseClauses(row.clauses);
  const canonical = artifactPayload({
    id: row.id,
    title: row.title,
    counterparty: row.counterparty,
    clauses,
    signerName,
    signedAt,
    declaration,
  });
  const artifactSha256 = hashArtifact(canonical);
  const signatureHash = hashSignature({
    agreementId: row.id,
    signerName,
    declaration,
    signedAt,
  });

  await input.pool.query(
    `update irma.agreements
        set status = 'signed',
            signed_at = $2::timestamptz,
            signer_name = $3,
            signature_hash = $4,
            artifact_sha256 = $5
      where id = $1 and status <> 'signed'`,
    [row.id, signedAt, signerName, signatureHash, artifactSha256],
  );

  const updated = await loadByToken(input.pool, input.token);
  if (!updated) return null;

  await input.events.publish({
    system: "irma",
    kind: "irma.agreement.signed",
    orgRef: updated.org_ref,
    actorKind: "system",
    subjectRef: `irma:agreement:${updated.id}`,
    requestId: input.requestId,
    payload: {
      title: updated.title,
      signerName,
      artifactSha256,
    },
  });

  return {
    ...toAgreement(updated),
    signedAt,
    signerName,
    artifactSha256,
  };
}

async function loadByToken(pool: pg.Pool, token: string): Promise<AgreementRow | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const { rows } = await pool.query(
    `select ${AGREEMENT_BY_TOKEN}
       from irma.agreements where token_hash = $1`,
    [hashIrmaToken(trimmed)],
  );
  return (rows[0] as AgreementRow | undefined) ?? null;
}

interface AgreementRow {
  id: string;
  org_ref: string;
  title: string;
  counterparty: string;
  status: string;
  body: string;
  clauses: unknown;
  created_at: Date | string;
  signed_at: Date | string | null;
  signer_name: string | null;
  artifact_sha256: string | null;
}

function toAgreement(row: {
  id: string;
  title: string;
  counterparty: string;
  status: string;
  body?: string | null;
  clauses?: unknown;
  created_at: Date | string;
  signed_at?: Date | string | null;
  signer_name?: string | null;
  artifact_sha256?: string | null;
}): Agreement {
  return {
    id: row.id,
    title: row.title,
    counterparty: row.counterparty,
    status: row.status,
    body: row.body ?? "",
    clauses: parseClauses(row.clauses),
    createdAt: new Date(row.created_at).toISOString(),
    signedAt: row.signed_at ? new Date(row.signed_at).toISOString() : null,
    signerName: row.signer_name ?? null,
    artifactSha256: row.artifact_sha256 ?? null,
  };
}
