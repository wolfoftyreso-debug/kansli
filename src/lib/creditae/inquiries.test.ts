import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { makeOrgNumber } from "../platform/org-number.ts";
import { createInquiry, getInquiry, listInquiries, recordAssessment } from "./inquiries.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

describe("creditae inquiries", () => {
  it("rejects a bad organisation number before anything is stored", async () => {
    await expect(
      createInquiry({
        pool: {
          query: async () => {
            throw new Error("should not write");
          },
        } as never,
        events: {
          publish: async () => {
            throw new Error("should not publish");
          },
        } as never,
        orgRef: "pixdrift:org:test",
        actorRef: "user-test",
        subjectOrgNumber: "123456-7890",
        requestId: "req-bad",
      }),
    ).rejects.toThrow(/Organisationsnumret/);
  });
});

live("creditae.inquiries (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "creditae-inquiries-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("records a counterpart without inventing a score", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:creditae-${Date.now()}`;
    const orgNumber = makeOrgNumber(17);

    const created = await createInquiry({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      subjectOrgNumber: orgNumber.replace("-", ""),
      subjectName: "Exempel motpart AB",
      reason: "Faktura på kredit",
      requestId: "req-creditae-1",
    });

    expect(created.status).toBe("open");
    expect(created.subjectOrgNumber).toBe(orgNumber);
    expect(created.assessment).toBeNull();
    expect(created).not.toHaveProperty("score");
    expect(created).not.toHaveProperty("rating");
    expect(created).not.toHaveProperty("bureau");

    const listed = await listInquiries(pool, orgRef);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.subjectName).toBe("Exempel motpart AB");

    const assessed = await recordAssessment({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      inquiryId: created.id,
      assessment: "watch",
      notes: "Ny kund. Bevaka första fakturan.",
      requestId: "req-creditae-2",
    });
    expect(assessed.status).toBe("assessed");
    expect(assessed.assessment).toBe("watch");
    expect(assessed).not.toHaveProperty("score");

    const detail = await getInquiry(pool, orgRef, created.id);
    expect(detail?.notes).toMatch(/Bevaka/);

    const createdEvents = await events.list({ orgRef, kind: "creditae.inquiry.created" });
    expect(createdEvents).toHaveLength(1);
    expect(createdEvents[0]?.payload["note"]).toMatch(/inget kreditbetyg/);
    expect(createdEvents[0]?.payload).not.toHaveProperty("score");

    const assessedEvents = await events.list({ orgRef, kind: "creditae.assessment.recorded" });
    expect(assessedEvents).toHaveLength(1);
    expect(assessedEvents[0]?.payload["assessment"]).toBe("watch");
    expect(JSON.stringify(assessedEvents[0])).not.toMatch(/UC|Creditsafe|TIC/);
  });
});
