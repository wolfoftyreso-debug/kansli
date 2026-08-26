import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { makeOrgNumber } from "../platform/org-number.ts";
import { createInquiry, getInquiry, listInquiries, recordAssessment } from "./inquiries.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

const savedCredit = {
  user: process.env.CREDITSAFE_USERNAME,
  pass: process.env.CREDITSAFE_PASSWORD,
};

afterEach(() => {
  if (savedCredit.user) process.env.CREDITSAFE_USERNAME = savedCredit.user;
  else delete process.env.CREDITSAFE_USERNAME;
  if (savedCredit.pass) process.env.CREDITSAFE_PASSWORD = savedCredit.pass;
  else delete process.env.CREDITSAFE_PASSWORD;
});

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

  it("records a counterpart without inventing a score when the bureau is off", async () => {
    delete process.env.CREDITSAFE_USERNAME;
    delete process.env.CREDITSAFE_PASSWORD;
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
      fetchImpl: async () => {
        throw new Error("should not fetch");
      },
    });

    expect(created.status).toBe("open");
    expect(created.subjectOrgNumber).toBe(orgNumber);
    expect(created.assessment).toBeNull();
    expect(created.vendorStatus).toBe("blocked");
    expect(created.vendorScore).toBeNull();
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
    expect(assessed.vendorStatus).toBe("blocked");
    expect(assessed).not.toHaveProperty("score");

    const detail = await getInquiry(pool, orgRef, created.id);
    expect(detail?.notes).toMatch(/Bevaka/);

    const createdEvents = await events.list({ orgRef, kind: "creditae.inquiry.created" });
    expect(createdEvents).toHaveLength(1);
    expect(createdEvents[0]?.payload["note"]).toMatch(/inget kreditbetyg/);
    expect(createdEvents[0]?.payload).not.toHaveProperty("score");

    const reportEvents = await events.list({ orgRef, kind: "creditae.report.fetched" });
    expect(reportEvents).toHaveLength(0);

    const assessedEvents = await events.list({ orgRef, kind: "creditae.assessment.recorded" });
    expect(assessedEvents).toHaveLength(1);
    expect(assessedEvents[0]?.payload["assessment"]).toBe("watch");
    expect(JSON.stringify(assessedEvents[0])).not.toMatch(/UC|Creditsafe|TIC/);
  });

  it("stores a pass-through report when the channel accepts and does not set the assessment", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:creditae-vendor-${Date.now()}`;
    const orgNumber = makeOrgNumber(21);

    const created = await createInquiry({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      subjectOrgNumber: orgNumber,
      subjectName: "Byråbolaget AB",
      requestId: "req-creditae-vendor",
      env: {
        CREDITSAFE_USERNAME: "cs-user",
        CREDITSAFE_PASSWORD: "cs-secret-not-real",
      },
      fetchImpl: async (url) => {
        const href = String(url);
        if (href.endsWith("/authenticate")) {
          return new Response(JSON.stringify({ token: "tok-test" }), { status: 200 });
        }
        if (href.includes("/companies?")) {
          return new Response(
            JSON.stringify({ companies: [{ id: "SE-X-TEST", name: "Byråbolaget AB" }] }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            report: {
              companySummary: { businessName: "Byråbolaget AB" },
              creditScore: {
                currentCreditRating: { providerValue: { value: "64" } },
                currentContractLimit: { currency: "SEK", value: "100000" },
              },
            },
          }),
          { status: 200 },
        );
      },
    });

    expect(created.assessment).toBeNull();
    expect(created.vendorStatus).toBe("fetched");
    expect(created.providerRef).toBe("SE-X-TEST");
    expect(created.vendorName).toBe("Byråbolaget AB");
    expect(created.vendorScore).toBe("64");
    expect(created.vendorLimit).toBe("100000 SEK");
    expect(JSON.stringify(created)).not.toContain("cs-secret-not-real");

    const fetched = await events.list({ orgRef, kind: "creditae.report.fetched" });
    expect(fetched).toHaveLength(1);
    expect(fetched[0]?.payload["vendorScore"]).toBe("64");
    expect(fetched[0]?.payload["note"]).toMatch(/inte er slutsats/);
    expect(JSON.stringify(fetched[0])).not.toContain("cs-secret-not-real");
  });

  it("keeps the inquiry when the bureau fails", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:creditae-fail-${Date.now()}`;
    const orgNumber = makeOrgNumber(22);

    const created = await createInquiry({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      subjectOrgNumber: orgNumber,
      requestId: "req-creditae-fail",
      env: {
        CREDITSAFE_USERNAME: "cs-user",
        CREDITSAFE_PASSWORD: "cs-secret-not-real",
      },
      fetchImpl: async () => new Response("no", { status: 503 }),
    });

    expect(created.status).toBe("open");
    expect(created.vendorStatus).toBe("failed");
    expect(created.vendorReason).toMatch(/503/);
    expect(created.assessment).toBeNull();
    const failed = await events.list({ orgRef, kind: "creditae.report.failed" });
    expect(failed).toHaveLength(1);
  });
});
