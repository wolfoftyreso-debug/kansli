import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createAgreement, hashIrmaToken, openAgreementByToken } from "./agreements.ts";

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

    expect(await openAgreementByToken({ pool, events, token: "fel", requestId: "req-bad" })).toBeNull();

    const first = await openAgreementByToken({ pool, events, token, requestId: "req-2" });
    expect(first?.status).toBe("viewed");
    const second = await openAgreementByToken({ pool, events, token, requestId: "req-3" });
    expect(second?.status).toBe("viewed");

    const listed = await events.list({ orgRef, kind: "irma.agreement.viewed" });
    expect(listed).toHaveLength(1);
  });
});
