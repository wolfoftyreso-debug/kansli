import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { hashTyraToken, tyraHubPath } from "./tokens.ts";
import {
  assignStorageCode,
  cancelCase,
  createCase,
  getCaseWorkCard,
  listCases,
  setCaseNotes,
  setStepStatus,
  updateCustomerContact,
} from "./cases.ts";
import { listCaseEvents, listCustomerCards } from "./hotel.ts";
import { getHubViewByToken, issueHubLink } from "./hub.ts";
import { recordVerifiedInspection } from "./inspections.ts";
import { listQuoteDrafts, saveQuoteDraft } from "./quotes.ts";

describe("hashTyraToken", () => {
  it("is stable and does not echo the token", () => {
    const token = "secret-hub-token";
    expect(hashTyraToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashTyraToken(token)).toBe(hashTyraToken(token));
    expect(hashTyraToken(token)).not.toContain(token);
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("TYRA cases + hub (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "tyra-cases-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("creates a case, compiles workflow steps, and issues a hashed hub link", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:tyra-${Date.now()}`;

    const created = await createCase({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Anna Andersson",
      registrationNumber: "abc 123",
      make: "Volvo",
      model: "XC60",
      intent: "TIRE_SWAP_APPOINTMENT",
      operations: ["TIRE_SWAP_FROM_STORAGE", "WHEEL_WASH", "WHEEL_BALANCE"],
      requestId: "req-tyra-1",
    });

    const listed = await listCases(pool, orgRef);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.registrationNumber).toBe("ABC123");
    expect(listed[0]?.customerName).toBe("Anna Andersson");

    const otherOrg = await listCases(pool, `${orgRef}-other`);
    expect(otherOrg).toHaveLength(0);

    const card = await getCaseWorkCard(pool, orgRef, created.id);
    expect(card?.headline).toBe("VOLVO XC60 — ABC123");
    expect(card?.steps.map((step) => step.kind)).toEqual([
      "INSPECT_WHEELS",
      "BALANCE",
      "SWAP_ON_VEHICLE",
      "WASH",
    ]);
    expect(card?.nextBestAction?.stepKind).toBe("INSPECT_WHEELS");

    const createdEvents = await events.list({ orgRef, kind: "tyra.case.created" });
    expect(createdEvents).toHaveLength(1);

    const hub = await issueHubLink({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerId: created.customerId,
      requestId: "req-tyra-hub",
    });
    expect(hub.path).toBe(tyraHubPath(hub.token));

    const { rows } = await pool.query<{ token_hash: string }>(
      `select token_hash from tyra.customer_hub_links where org_ref = $1 and customer_id = $2`,
      [orgRef, created.customerId],
    );
    expect(rows[0]?.token_hash).toBe(hashTyraToken(hub.token));
    expect(rows[0]?.token_hash).not.toBe(hub.token);

    expect(await getHubViewByToken(pool, "fel-token")).toBeNull();
    const view = await getHubViewByToken(pool, hub.token);
    expect(view?.customerName).toBe("Anna Andersson");
    expect(view?.vehicle?.registrationNumber).toBe("ABC123");
    expect(view?.positions).toEqual([]);
    expect(view?.commercialNote).toMatch(/ingen verifierad inspektion/i);

    const issued = await events.list({ orgRef, kind: "tyra.hub.link.issued" });
    expect(issued).toHaveLength(1);
  });

  it("marks the case done when every required step is done", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:tyra-done-${Date.now()}`;
    const created = await createCase({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Erik",
      registrationNumber: "XYZ999",
      intent: "STORE_ONLY",
      operations: ["STORAGE_IN"],
      requestId: "req-tyra-done-1",
    });
    const card = await getCaseWorkCard(pool, orgRef, created.id);
    expect(card?.steps.length).toBeGreaterThan(0);
    const registered = await pool.query<{ status: string; storage_status: string }>(
      `select status, storage_status from tyra.wheel_sets where org_ref = $1`,
      [orgRef],
    );
    expect(registered.rows[0]?.status).toBe("REGISTERED");
    expect(registered.rows[0]?.storage_status).toBe("IN_WORKSHOP");
    for (const step of card!.steps) {
      await setStepStatus({
        pool,
        events,
        orgRef,
        actorRef: "user-test",
        tireCaseId: created.id,
        stepKind: step.kind,
        status: "DONE",
        requestId: `req-step-${step.kind}`,
      });
    }

    const done = await getCaseWorkCard(pool, orgRef, created.id);
    expect(done?.caseStatus).toBe("DONE");
    const stored = await pool.query<{ storage_status: string }>(
      `select storage_status from tyra.wheel_sets where org_ref = $1`,
      [orgRef],
    );
    expect(stored.rows[0]?.storage_status).toBe("STORED");
    const cards = await listCustomerCards(pool, orgRef);
    expect(cards[0]?.customer.name).toBe("Erik");
    expect(cards[0]?.counts.wheelSets).toBe(1);
    expect((await listCaseEvents(pool, orgRef, created.id)).length).toBeGreaterThan(0);
    const completed = await events.list({ orgRef, kind: "tyra.case.completed" });
    expect(completed).toHaveLength(1);

    await recordVerifiedInspection({
      pool,
      orgRef,
      actorRef: "user-test",
      tireCaseId: created.id,
      readings: [
        { position: "LF", treadDepthMm: 6 },
        { position: "RF", treadDepthMm: 6 },
        { position: "LR", treadDepthMm: 5.5 },
        { position: "RR", treadDepthMm: 5.5 },
      ],
    });
    const quote = await saveQuoteDraft({
      pool,
      orgRef,
      tireCaseId: created.id,
      title: "Vinterdäck",
      quantity: 4,
      unitCostOre: 120_000,
      installationOrePerTyre: 15_000,
      environmentalOrePerTyre: 2_500,
      markupPercent: 20,
    });
    expect(quote.snapshot.totalCustomerPriceOre).toBeGreaterThan(0);
    expect((await listQuoteDrafts(pool, orgRef, created.id))[0]?.id).toBe(quote.id);

    const hub = await issueHubLink({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerId: created.customerId,
      requestId: "req-tyra-hub-inspect",
    });
    const view = await getHubViewByToken(pool, hub.token);
    expect(view?.positions).toHaveLength(4);
    expect(view?.commercialNote).not.toMatch(/Ingen verifierad inspektion/);
  });

  it("lets the workshop edit the customer, assign a bay, note, and cancel", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:tyra-ops-${Date.now()}`;
    const created = await createCase({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Lisa",
      registrationNumber: "OPS001",
      phone: "0701111111",
      intent: "STORE_ONLY",
      operations: ["STORAGE_IN"],
      requestId: "req-tyra-ops-1",
    });

    await updateCustomerContact({
      pool,
      orgRef,
      customerId: created.customerId,
      name: "Lisa Berg",
      phone: "0702222222",
      email: "lisa@example.test",
    });
    await assignStorageCode({
      pool,
      orgRef,
      actorRef: "user-test",
      tireCaseId: created.id,
      storageCode: "b-04",
    });
    await setCaseNotes({
      pool,
      orgRef,
      tireCaseId: created.id,
      notes: "Kund hämtar fredag.",
    });

    const card = await getCaseWorkCard(pool, orgRef, created.id);
    expect(card?.customerName).toBe("Lisa Berg");
    expect(card?.customerPhone).toBe("0702222222");
    expect(card?.storageCode).toBe("B-04");
    expect(card?.advisorNotes).toBe("Kund hämtar fredag.");
    expect(card?.steps.find((step) => step.kind === "VERIFY_STORAGE_LOCATION")?.status).toBe(
      "DONE",
    );
    const cards = await listCustomerCards(pool, orgRef);
    expect(cards[0]?.vehicles[0]?.wheelSets[0]?.storageCode).toBe("B-04");
    expect(cards[0]?.customer.name).toBe("Lisa Berg");

    await cancelCase({ pool, orgRef, tireCaseId: created.id });
    const cancelled = await getCaseWorkCard(pool, orgRef, created.id);
    expect(cancelled?.caseStatus).toBe("CANCELLED");
  });
});
