import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import {
  capabilityStatuses,
  listActions,
  listSignals,
  ruleStrategist,
  runAnalysis,
} from "./engine.ts";
import { compileImplementationPrompt } from "./prompt.ts";
import { createProject, listProjects, parseGoal, parsePosture, setPosture } from "./projects.ts";
import { completeAction, decideAction, listReleases } from "./releases.ts";
import { usageTotals } from "./usage.ts";

function mockWebintel(url: string | URL | Request): Promise<Response> {
  const type = new URL(String(url)).searchParams.get("type");
  if (type === "domain_organic") {
    return Promise.resolve(
      new Response(
        "Keyword;Position;Search Volume;Keyword Difficulty Index;Traffic\ndäckhotell umeå;3;480;28;120",
        { status: 200 },
      ),
    );
  }
  if (type === "backlinks_overview") {
    return Promise.resolve(
      new Response("ascore;total;domains_num;urls_num\n42;1880;310;940", { status: 200 }),
    );
  }
  return Promise.resolve(
    new Response(
      "Domain;Rank;Organic Keywords;Organic Traffic;Adwords Keywords\nexempel.se;2751;1483;12400;0",
      { status: 200 },
    ),
  );
}

describe("MAJ domain", () => {
  it("parses goals and postures strictly", () => {
    expect(parseGoal("all")).toBe("all");
    expect(parseGoal("growth-hack")).toBeNull();
    expect(parsePosture("hedge")).toBe("hedge");
    expect(parsePosture("nuclear")).toBeNull();
  });

  it("fails closed: unconfigured sources become connect-source decisions, never numbers", () => {
    const proposals = ruleStrategist({
      project: {
        id: "p1",
        domain: "exempel.se",
        market: "SE",
        language: "sv",
        goal: "all",
        posture: "balanced",
        status: "active",
        createdAt: "",
        updatedAt: "",
      },
      overview: null,
      keywords: null,
      backlinks: null,
      capabilities: capabilityStatuses({}),
    });
    const kinds = proposals.map((proposal) => proposal.kind);
    expect(kinds).toContain("connect_source");
    expect(kinds).not.toContain("content");
    expect(kinds).not.toContain("competitive");
  });

  it("proposes evidence-backed decisions when the overview is in", () => {
    const proposals = ruleStrategist({
      project: {
        id: "p1",
        domain: "exempel.se",
        market: "SE",
        language: "sv",
        goal: "competitors",
        posture: "hedge",
        status: "active",
        createdAt: "",
        updatedAt: "",
      },
      overview: {
        ok: true,
        domain: "exempel.se",
        rank: "2751",
        organicKeywords: "1483",
        organicTraffic: "12400",
        adwordsKeywords: "0",
      },
      keywords: {
        ok: true,
        domain: "exempel.se",
        keywords: [
          {
            phrase: "däckhotell umeå",
            position: "3",
            volume: "480",
            difficulty: "28",
            traffic: "120",
          },
        ],
      },
      backlinks: {
        ok: true,
        domain: "exempel.se",
        ascore: "42",
        total: "1880",
        referringDomains: "310",
        urls: "940",
      },
      capabilities: capabilityStatuses({}),
    });
    const competitive = proposals.find((proposal) => proposal.kind === "competitive");
    expect(competitive).toBeDefined();
    expect(competitive!.why).toContain("1483");
    expect(competitive!.evidence[0]).toHaveProperty("capability", "webintel");
    expect(proposals.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "Confirm the competitor set",
        "Protect the brand search",
        "Publish pages for the keyword gaps",
        "Review the backlink baseline",
        "Close the lawful competitive gap",
      ]),
    );
  });

  it("compiles a stack-agnostic implementation prompt that inspects before it changes", () => {
    const prompt = compileImplementationPrompt({
      project: {
        id: "p1",
        domain: "exempel.se",
        market: "SE",
        language: "sv",
        goal: "all",
        posture: "balanced",
        status: "active",
        createdAt: "",
        updatedAt: "",
      },
      action: {
        id: "a1",
        kind: "content",
        title: "Protect the brand search",
        why: "Test reason.",
        risk: "low",
        expectedImpact: "medium",
        confidence: 70,
        state: "approved",
        evidence: [{ capability: "webintel", field: "adwordsKeywords", value: "0" }],
        createdAt: "",
        decidedAt: null,
      },
    });
    expect(prompt.startsWith("IMPLEMENTATION BRIEF — MAJ")).toBe(true);
    expect(prompt).toContain("Inspect the actual codebase");
    expect(prompt).toContain("ACCEPTANCE");
    expect(prompt).toContain("release.v1");
    // Capability-named, never vendor-named.
    expect(prompt.toLowerCase()).not.toContain("semrush");
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("maj (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "maj-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("runs the loop: project → signals → decisions → approval → versioned release", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:maj-${Date.now()}`;

    const project = await createProject({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      domain: "https://www.Exempel.se/",
      goal: "all",
      requestId: "req-maj-1",
    });
    expect(project.domain).toBe("exempel.se");
    expect((await listProjects(pool, orgRef)).map((p) => p.id)).toContain(project.id);

    // Analysis with the vendor mocked: usage booked, signal stored, actions queued.
    const run = await runAnalysis({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      project,
      requestId: "req-maj-2",
      env: { SEMRUSH_API_KEY: "sm-secret-not-real" },
      fetchImpl: mockWebintel,
    });
    expect(run.signals).toBe(3);
    expect(run.proposed).toBeGreaterThanOrEqual(3);

    const usage = await usageTotals(pool, orgRef, project.id);
    expect(usage.vendor_units).toBe(100);

    const signals = await listSignals(pool, orgRef, project.id);
    expect(signals[0]!.source).toBe("webintel");
    expect(JSON.stringify(signals)).not.toContain("sm-secret-not-real");

    // A second run must not duplicate open decisions.
    const rerun = await runAnalysis({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      project,
      requestId: "req-maj-3",
      env: { SEMRUSH_API_KEY: "sm-secret-not-real" },
      fetchImpl: mockWebintel,
    });
    expect(rerun.proposed).toBe(0);

    const actions = await listActions(pool, orgRef, project.id);
    const competitive = actions.find((action) => action.kind === "competitive")!;
    expect(competitive.state).toBe("proposed");

    // Nothing executes without explicit approval.
    await expect(
      completeAction({
        pool,
        events,
        orgRef,
        actorRef: "user-test",
        actionId: competitive.id,
        requestId: "req-maj-4",
      }),
    ).rejects.toThrow(/approved/i);

    await decideAction({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      actionId: competitive.id,
      decision: "approved",
      requestId: "req-maj-5",
    });
    const release = await completeAction({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      actionId: competitive.id,
      note: "Konkurrentbilden bekräftad: tre bevakade domäner.",
      requestId: "req-maj-6",
    });
    expect(release.version).toBe("maj-1.0.1");
    expect(release.machine["contract"]).toBe("release.v1");

    const releases = await listReleases(pool, orgRef, project.id);
    expect(releases).toHaveLength(1);
    expect(releases[0]!.machine["decisions"]).toHaveLength(1);

    const published = await events.list({ orgRef, kind: "maj.release.published" });
    expect(published).toHaveLength(1);
    expect(String(published[0]?.payload["title"])).toContain("Search Update 1.0.1");

    // Posture is a setting, HEDGE included.
    await setPosture(pool, orgRef, project.id, "hedge");
  });

  it("stays honest without any vendor key: no numbers, only connect-source decisions", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:maj-blocked-${Date.now()}`;
    const project = await createProject({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      domain: "tyst.se",
      goal: "rank",
      requestId: "req-maj-b1",
    });
    const run = await runAnalysis({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      project,
      requestId: "req-maj-b2",
      env: {},
      fetchImpl: async () => {
        throw new Error("should not fetch");
      },
    });
    expect(run.signals).toBe(0);
    const actions = await listActions(pool, orgRef, project.id);
    expect(actions.every((action) => action.kind === "connect_source")).toBe(true);
    const usage = await usageTotals(pool, orgRef, project.id);
    expect(usage.vendor_units).toBe(0);
  });
});
