import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { ACKNOWLEDGEMENT_DECLARATION } from "./clauses.ts";
import { verifyAgreementIntegrity } from "./integrity.ts";
import {
  acknowledgeAgreement,
  createAgreement,
  getAgreement,
  hashArtifact,
  hashIrmaToken,
  hashSignature,
  listAgreements,
  openAgreementByToken,
  peekAgreementByToken,
  reissueAgreementToken,
  revokeAgreement,
} from "./agreements.ts";

describe("hashIrmaToken", () => {
  it("is stable and does not echo the token", () => {
    const token = "secret-token-value";
    expect(hashIrmaToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIrmaToken(token)).toBe(hashIrmaToken(token));
    expect(hashIrmaToken(token)).not.toContain(token);
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("IRMA magic link (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "irma-link-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("stores only the hash, then marks viewed on first open", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:irma-${Date.now()}`;
    const created = await createAgreement({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      title: "Underlag",
      counterparty: "Motpart AB",
      requestId: "req-1",
    });
    expect(created.magicLink?.startsWith("/irma/l/")).toBe(true);
    const token = created.magicLink!.slice("/irma/l/".length);

    const { rows } = await pool.query<{ token_hash: string }>(
      `select token_hash from irma.agreements where id = $1`,
      [created.id],
    );
    expect(rows[0]?.token_hash).toBe(hashIrmaToken(token));
    expect(rows[0]?.token_hash).not.toBe(token);

    expect(
      await openAgreementByToken({ pool, events, token: "fel", requestId: "req-bad" }),
    ).toBeNull();
    expect(await peekAgreementByToken(pool, token)).toMatchObject({ status: "draft" });
    expect(await events.list({ orgRef, kind: "irma.agreement.viewed" })).toHaveLength(0);

    const first = await openAgreementByToken({ pool, events, token, requestId: "req-2" });
    expect(first?.status).toBe("viewed");
    const second = await openAgreementByToken({ pool, events, token, requestId: "req-3" });
    expect(second?.status).toBe("viewed");

    const listed = await events.list({ orgRef, kind: "irma.agreement.viewed" });
    expect(listed).toHaveLength(1);
  });

  it("stores a hashed acknowledgement once and does not keep the declaration", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:irma-sign-${Date.now()}`;
    const created = await createAgreement({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      title: "Anställningsunderlag",
      counterparty: "Anna Andersson",
      requestId: "req-sign-1",
    });
    expect(created.clauses.length).toBeGreaterThan(0);
    const token = created.magicLink!.slice("/irma/l/".length);

    const opened = await openAgreementByToken({ pool, events, token, requestId: "req-sign-2" });
    expect(opened?.status).toBe("viewed");

    const first = await acknowledgeAgreement({
      pool,
      events,
      token,
      signerName: "Anna Andersson",
      requestId: "req-sign-3",
    });
    expect(first?.status).toBe("signed");
    expect(first?.signerName).toBe("Anna Andersson");
    expect(first?.artifactSha256).toMatch(/^[0-9a-f]{64}$/);

    const { rows } = await pool.query<{ signature_hash: string; artifact_sha256: string }>(
      `select signature_hash, artifact_sha256 from irma.agreements where id = $1`,
      [created.id],
    );
    expect(rows[0]?.signature_hash).toBe(
      hashSignature({
        agreementId: created.id,
        signerName: "Anna Andersson",
        declaration: ACKNOWLEDGEMENT_DECLARATION,
        signedAt: first!.signedAt!,
      }),
    );
    expect(rows[0]?.signature_hash).not.toContain("Anna");
    expect(JSON.stringify(rows[0])).not.toContain(ACKNOWLEDGEMENT_DECLARATION);

    const second = await acknowledgeAgreement({
      pool,
      events,
      token,
      signerName: "Någon Annan",
      requestId: "req-sign-4",
    });
    expect(second?.signerName).toBe("Anna Andersson");
    expect(second?.artifactSha256).toBe(first?.artifactSha256);

    const signedEvents = await events.list({ orgRef, kind: "irma.agreement.signed" });
    expect(signedEvents).toHaveLength(1);
    expect(hashArtifact("x")).toMatch(/^[0-9a-f]{64}$/);

    const integrity = verifyAgreementIntegrity({
      id: first!.id,
      title: first!.title,
      counterparty: first!.counterparty,
      body: first!.body,
      clauses: first!.clauses,
      contentSha256: first!.contentSha256,
      signerName: first!.signerName,
      signedAt: first!.signedAt,
      artifactSha256: first!.artifactSha256,
    });
    expect(integrity).toEqual({ contentMatches: true, artifactMatches: true });
  });

  it("does not sign a level-0 information sheet", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:irma-l0-${Date.now()}`;
    const created = await createAgreement({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      title: "Info",
      counterparty: "Läsare",
      verificationLevel: 0,
      requestId: "req-l0-1",
    });
    expect(created.verificationLevel).toBe(0);
    const token = created.magicLink!.slice("/irma/l/".length);
    await openAgreementByToken({ pool, events, token, requestId: "req-l0-2" });
    const ack = await acknowledgeAgreement({
      pool,
      events,
      token,
      signerName: "Läsare",
      requestId: "req-l0-3",
    });
    expect(ack?.status).toBe("viewed");
    expect(ack?.artifactSha256).toBeNull();
    expect(await events.list({ orgRef, kind: "irma.agreement.signed" })).toHaveLength(0);
  });

  it("rejects expired and revoked tokens and scopes reads to the org", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:irma-sec-${Date.now()}`;
    const created = await createAgreement({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      title: "Sekretessunderlag",
      counterparty: "Utomstående",
      requestId: "req-sec-1",
    });
    const token = created.magicLink!.slice("/irma/l/".length);

    expect(await getAgreement(pool, "pixdrift:org:other", created.id)).toBeNull();
    expect(await getAgreement(pool, orgRef, created.id)).not.toBeNull();

    const found = await listAgreements(pool, orgRef, "Sekretess%");
    expect(found).toHaveLength(1);
    const miss = await listAgreements(pool, orgRef, "finns-inte");
    expect(miss).toHaveLength(0);

    await pool.query(
      `update irma.agreements set token_expires_at = now() - interval '1 hour' where id = $1`,
      [created.id],
    );
    expect(await openAgreementByToken({ pool, events, token, requestId: "req-sec-2" })).toBeNull();
    expect((await getAgreement(pool, orgRef, created.id))?.status).toBe("expired");

    const live = await createAgreement({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      title: "Att återkalla",
      counterparty: "Utomstående",
      requestId: "req-sec-3",
    });
    const liveToken = live.magicLink!.slice("/irma/l/".length);
    const revoked = await revokeAgreement({
      pool,
      events,
      orgRef,
      id: live.id,
      actorRef: "user-test",
      requestId: "req-sec-4",
    });
    expect(revoked?.status).toBe("cancelled");
    expect(
      await openAgreementByToken({ pool, events, token: liveToken, requestId: "req-sec-5" }),
    ).toBeNull();
    const again = await revokeAgreement({
      pool,
      events,
      orgRef,
      id: live.id,
      actorRef: "user-test",
      requestId: "req-sec-6",
    });
    expect(again?.status).toBe("cancelled");
    expect(await events.list({ orgRef, kind: "irma.agreement.cancelled" })).toHaveLength(1);
  });

  it("reissues a new hashed token for unsigned agreements", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:irma-reissue-${Date.now()}`;
    const created = await createAgreement({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      title: "Tappad länk",
      counterparty: "Motpart",
      requestId: "req-re-1",
    });
    const oldToken = created.magicLink!.slice("/irma/l/".length);
    const reissued = await reissueAgreementToken({
      pool,
      events,
      orgRef,
      id: created.id,
      actorRef: "user-test",
      requestId: "req-re-2",
    });
    const newToken = reissued?.magicLink?.slice("/irma/l/".length);
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(oldToken);
    expect(
      await openAgreementByToken({ pool, events, token: oldToken, requestId: "req-re-3" }),
    ).toBeNull();
    expect(
      (await openAgreementByToken({ pool, events, token: newToken!, requestId: "req-re-4" }))?.id,
    ).toBe(created.id);
    const createdEvents = await events.list({ orgRef, kind: "irma.agreement.created" });
    expect(createdEvents.some((event) => event.payload["reissued"] === true)).toBe(true);
  });
});
