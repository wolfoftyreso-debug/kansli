import { createHash, randomBytes, randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import {
  ACKNOWLEDGEMENT_DECLARATION,
  DEFAULT_CLAUSES,
  parseClauses,
  type AgreementClause,
} from "./clauses.ts";

import {
  IRMA_TOKEN_TTL_MS,
  effectiveStatus,
  parseVerificationLevel,
  type VerificationLevel,
} from "./status.ts";

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
  contentSha256: string | null;
  verificationLevel: VerificationLevel;
  tokenExpiresAt: string | null;
  viewedAt: string | null;
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

export function contentPayload(input: {
  title: string;
  counterparty: string;
  body: string;
  clauses: AgreementClause[];
}): string {
  return JSON.stringify({
    title: input.title,
    counterparty: input.counterparty,
    body: input.body,
    clauses: input.clauses,
  });
}

export function hashContent(input: {
  title: string;
  counterparty: string;
  body: string;
  clauses: AgreementClause[];
}): string {
  return hashArtifact(contentPayload(input));
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
       signed_at, signer_name, artifact_sha256, content_sha256, verification_level,
       token_expires_at, token_revoked_at, viewed_at`;
const AGREEMENT_BY_TOKEN = `id, org_ref, title, counterparty, status, body, clauses, created_at,
       signed_at, signer_name, artifact_sha256, content_sha256, verification_level,
       token_expires_at, token_revoked_at, viewed_at`;

export async function listAgreements(
  pool: pg.Pool,
  orgRef: string,
  query?: string,
): Promise<Agreement[]> {
  const q = query?.trim().replace(/[%_]/g, "");
  const { rows } = q
    ? await pool.query(
        `select ${AGREEMENT_COLUMNS} from irma.agreements
          where org_ref = $1
            and (title ilike $2 or counterparty ilike $2)
          order by created_at desc`,
        [orgRef, `%${q}%`],
      )
    : await pool.query(
        `select ${AGREEMENT_COLUMNS} from irma.agreements
          where org_ref = $1 order by created_at desc`,
        [orgRef],
      );
  return rows.map(toAgreement);
}

export async function getAgreement(
  pool: pg.Pool,
  orgRef: string,
  id: string,
): Promise<Agreement | null> {
  const { rows } = await pool.query(
    `select ${AGREEMENT_COLUMNS} from irma.agreements where id = $1 and org_ref = $2`,
    [id, orgRef],
  );
  return rows[0] ? toAgreement(rows[0]) : null;
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
  verificationLevel?: VerificationLevel;
}): Promise<Agreement> {
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashIrmaToken(token);
  const title = input.title.trim();
  const counterparty = input.counterparty.trim();
  const body = (input.body ?? "").trim();
  const clauses = input.clauses?.length ? input.clauses : [...DEFAULT_CLAUSES];
  const verificationLevel = parseVerificationLevel(input.verificationLevel);
  const contentSha256 = hashContent({ title, counterparty, body, clauses });
  const tokenExpiresAt = new Date(Date.now() + IRMA_TOKEN_TTL_MS).toISOString();
  await input.pool.query(
    `insert into irma.agreements
       (id, org_ref, title, counterparty, status, token_hash, body, clauses,
        verification_level, content_sha256, token_expires_at)
     values ($1,$2,$3,$4,'draft',$5,$6,$7::jsonb,$8,$9,$10::timestamptz)`,
    [
      id,
      input.orgRef,
      title,
      counterparty,
      tokenHash,
      body,
      JSON.stringify(clauses),
      verificationLevel,
      contentSha256,
      tokenExpiresAt,
    ],
  );
  await input.events.publish({
    system: "irma",
    kind: "irma.agreement.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `irma:agreement:${id}`,
    requestId: input.requestId,
    payload: { title, counterparty, verificationLevel },
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
    contentSha256,
    verificationLevel,
    tokenExpiresAt,
    viewedAt: null,
    magicLink: irmaLinkPath(token),
  };
}

/**
 * Load the agreement for a hashed token without changing status.
 * GET and prefetch must use this. "Öppnat" is a human action, not a page view.
 */
export async function peekAgreementByToken(
  pool: pg.Pool,
  token: string,
): Promise<Agreement | null> {
  const row = await loadByToken(pool, token);
  return row ? toAgreement(row) : null;
}

/**
 * Counterparty confirms they opened the hashed token. First confirmation moves
 * draft → viewed and publishes. The token itself is never stored.
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
    const viewedAt = new Date().toISOString();
    const updated = await input.pool.query(
      `update irma.agreements set status = 'viewed', viewed_at = $2::timestamptz
        where id = $1 and status = 'draft'
        returning viewed_at`,
      [row.id, viewedAt],
    );
    if ((updated.rowCount ?? 0) > 0) {
      row.status = "viewed";
      row.viewed_at = viewedAt;
      await input.events.publish({
        system: "irma",
        kind: "irma.agreement.viewed",
        orgRef: row.org_ref,
        actorKind: "system",
        subjectRef: `irma:agreement:${row.id}`,
        requestId: input.requestId,
        payload: { title: row.title },
      });
    } else {
      const current = await loadByToken(input.pool, input.token);
      return current ? toAgreement(current) : null;
    }
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
  if (parseVerificationLevel(row.verification_level) === 0) return toAgreement(row);
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

  const updated = await input.pool.query(
    `update irma.agreements
        set status = 'signed',
            signed_at = $2::timestamptz,
            signer_name = $3,
            signature_hash = $4,
            artifact_sha256 = $5
      where id = $1 and status <> 'signed' and token_revoked_at is null
      returning ${AGREEMENT_BY_TOKEN}`,
    [row.id, signedAt, signerName, signatureHash, artifactSha256],
  );

  if (updated.rowCount === 0) {
    const current = await loadByToken(input.pool, input.token);
    return current ? toAgreement(current) : null;
  }

  const saved = updated.rows[0] as AgreementRow;
  await input.events.publish({
    system: "irma",
    kind: "irma.agreement.signed",
    orgRef: saved.org_ref,
    actorKind: "system",
    subjectRef: `irma:agreement:${saved.id}`,
    requestId: input.requestId,
    payload: {
      title: saved.title,
      signerName,
      artifactSha256,
    },
  });

  return toAgreement(saved);
}

export async function revokeAgreement(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  id: string;
  actorRef: string;
  requestId: string;
}): Promise<Agreement | null> {
  const existing = await getAgreement(input.pool, input.orgRef, input.id);
  if (!existing) return null;
  if (existing.status === "signed" || existing.status === "cancelled") return existing;

  const result = await input.pool.query(
    `update irma.agreements
        set status = 'cancelled', token_revoked_at = now()
      where id = $1 and org_ref = $2 and status not in ('signed', 'cancelled')
      returning id`,
    [input.id, input.orgRef],
  );
  if ((result.rowCount ?? 0) > 0) {
    await input.events.publish({
      system: "irma",
      kind: "irma.agreement.cancelled",
      orgRef: input.orgRef,
      actorKind: "user",
      actorRef: input.actorRef,
      subjectRef: `irma:agreement:${input.id}`,
      requestId: input.requestId,
      payload: { title: existing.title },
    });
  }
  return getAgreement(input.pool, input.orgRef, input.id);
}

export async function reissueAgreementToken(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  id: string;
  actorRef: string;
  requestId: string;
}): Promise<Agreement | null> {
  const existing = await getAgreement(input.pool, input.orgRef, input.id);
  if (!existing) return null;
  if (existing.status === "signed" || existing.status === "cancelled") return existing;

  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashIrmaToken(token);
  const tokenExpiresAt = new Date(Date.now() + IRMA_TOKEN_TTL_MS).toISOString();
  const updated = await input.pool.query(
    `update irma.agreements
        set token_hash = $3,
            token_expires_at = $4::timestamptz,
            token_revoked_at = null
      where id = $1 and org_ref = $2 and status not in ('signed', 'cancelled')
      returning id`,
    [input.id, input.orgRef, tokenHash, tokenExpiresAt],
  );
  if ((updated.rowCount ?? 0) === 0) return existing;

  await input.events.publish({
    system: "irma",
    kind: "irma.agreement.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `irma:agreement:${input.id}`,
    requestId: input.requestId,
    payload: {
      title: existing.title,
      counterparty: existing.counterparty,
      verificationLevel: existing.verificationLevel,
      reissued: true,
    },
  });
  const next = await getAgreement(input.pool, input.orgRef, input.id);
  return next ? { ...next, magicLink: irmaLinkPath(token) } : null;
}

export function exportAgreementRecord(agreement: Agreement): string {
  return JSON.stringify(
    {
      id: agreement.id,
      title: agreement.title,
      counterparty: agreement.counterparty,
      status: agreement.status,
      verificationLevel: agreement.verificationLevel,
      body: agreement.body,
      clauses: agreement.clauses,
      contentSha256: agreement.contentSha256,
      artifactSha256: agreement.artifactSha256,
      signerName: agreement.signerName,
      signedAt: agreement.signedAt,
      createdAt: agreement.createdAt,
    },
    null,
    2,
  );
}

async function loadByToken(pool: pg.Pool, token: string): Promise<AgreementRow | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const { rows } = await pool.query(
    `select ${AGREEMENT_BY_TOKEN}
       from irma.agreements where token_hash = $1`,
    [hashIrmaToken(trimmed)],
  );
  const row = (rows[0] as AgreementRow | undefined) ?? null;
  if (!row) return null;
  if (row.token_revoked_at) return null;
  if (
    row.status !== "signed" &&
    row.token_expires_at &&
    new Date(row.token_expires_at) <= new Date()
  ) {
    return null;
  }
  return row;
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
  content_sha256: string | null;
  verification_level: number;
  token_expires_at: Date | string | null;
  token_revoked_at?: Date | string | null;
  viewed_at: Date | string | null;
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
  content_sha256?: string | null;
  verification_level?: number;
  token_expires_at?: Date | string | null;
  token_revoked_at?: Date | string | null;
  viewed_at?: Date | string | null;
}): Agreement {
  const tokenExpiresAt = row.token_expires_at ? new Date(row.token_expires_at).toISOString() : null;
  const tokenRevokedAt = row.token_revoked_at ? new Date(row.token_revoked_at).toISOString() : null;
  return {
    id: row.id,
    title: row.title,
    counterparty: row.counterparty,
    status: effectiveStatus({
      status: row.status,
      tokenExpiresAt,
      tokenRevokedAt,
    }),
    body: row.body ?? "",
    clauses: parseClauses(row.clauses),
    createdAt: new Date(row.created_at).toISOString(),
    signedAt: row.signed_at ? new Date(row.signed_at).toISOString() : null,
    signerName: row.signer_name ?? null,
    artifactSha256: row.artifact_sha256 ?? null,
    contentSha256: row.content_sha256 ?? null,
    verificationLevel: parseVerificationLevel(row.verification_level),
    tokenExpiresAt,
    viewedAt: row.viewed_at ? new Date(row.viewed_at).toISOString() : null,
  };
}
