import { describe, expect, it, vi } from "vitest";
import {
  normalizeDomain,
  parseCsvRows,
  requestBacklinksOverview,
  requestDomainOverview,
  requestOrganicKeywords,
  webintelBaseUrl,
  webintelConfigured,
  webintelDatabase,
  WEBINTEL_PRODUCTION_BASE,
} from "./webintel.ts";

const RANKS = [
  "Domain;Rank;Organic Keywords;Organic Traffic;Adwords Keywords",
  "exempel.se;1234;567;8901;23",
].join("\r\n");

const ORGANIC = [
  "Keyword;Position;Search Volume;Keyword Difficulty Index;Traffic",
  "däckhotell umeå;3;480;28;120",
  "däckbyte;12;2400;41;90",
].join("\r\n");

const BACKLINKS = ["ascore;total;domains_num;urls_num", "42;1880;310;940"].join("\r\n");

function response(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain" } });
}

describe("webintel channel (Semrush)", () => {
  it("is off without a key and never calls the vendor", async () => {
    expect(webintelConfigured({})).toBe(false);
    expect(webintelConfigured({ SEMRUSH_API_KEY: " " })).toBe(false);
    expect(webintelConfigured({ SEMRUSH_API_KEY: "k" })).toBe(true);
    const fetchImpl = vi.fn();
    const report = await requestDomainOverview(
      { domain: "exempel.se" },
      fetchImpl as unknown as typeof fetch,
      {},
    );
    expect(report.ok).toBe(false);
    if (!report.ok) expect(report.reason).toMatch(/Nothing is fetched/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("uses the production base unless overridden, and the se database", () => {
    expect(webintelBaseUrl({})).toBe(WEBINTEL_PRODUCTION_BASE);
    expect(webintelBaseUrl({ SEMRUSH_BASE_URL: "http://127.0.0.1:9600/" })).toBe(
      "http://127.0.0.1:9600",
    );
    expect(webintelDatabase({})).toBe("se");
    expect(webintelDatabase({ SEMRUSH_DATABASE: "US" })).toBe("us");
  });

  it("normalizes URLs down to a bare domain", () => {
    expect(normalizeDomain("https://www.Exempel.se/sida?x=1")).toBe("exempel.se");
    expect(normalizeDomain("exempel.se:8080")).toBe("exempel.se");
    expect(normalizeDomain("sub.exempel.co.uk")).toBe("sub.exempel.co.uk");
    expect(normalizeDomain("inte en domän")).toBeNull();
    expect(normalizeDomain("")).toBeNull();
  });

  it("parses multi-row CSV including empty cells", () => {
    const rows = parseCsvRows("A;B\none;;\ntwo;2");
    expect(rows).toEqual([
      { A: "one", B: "" },
      { A: "two", B: "2" },
    ]);
  });

  it("parses the vendor CSV verbatim", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const parsed = new URL(String(url));
      expect(parsed.searchParams.get("type")).toBe("domain_ranks");
      expect(parsed.searchParams.get("domain")).toBe("exempel.se");
      expect(parsed.searchParams.get("database")).toBe("se");
      return response(RANKS);
    });
    const report = await requestDomainOverview(
      { domain: "https://www.exempel.se/" },
      fetchImpl as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(report).toEqual({
      ok: true,
      domain: "exempel.se",
      rank: "1234",
      organicKeywords: "567",
      organicTraffic: "8901",
      adwordsKeywords: "23",
    });
  });

  it("returns organic keywords as verbatim rows, capability-named", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const parsed = new URL(String(url));
      expect(parsed.searchParams.get("type")).toBe("domain_organic");
      expect(parsed.searchParams.get("display_limit")).toBe("5");
      return response(ORGANIC);
    });
    const report = await requestOrganicKeywords(
      { domain: "exempel.se" },
      fetchImpl as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(report.ok).toBe(true);
    if (report.ok) {
      expect(report.keywords).toHaveLength(2);
      expect(report.keywords[0]).toEqual({
        phrase: "däckhotell umeå",
        position: "3",
        volume: "480",
        difficulty: "28",
        traffic: "120",
      });
    }
  });

  it("returns the backlink baseline verbatim", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const parsed = new URL(String(url));
      expect(parsed.searchParams.get("type")).toBe("backlinks_overview");
      expect(parsed.searchParams.get("target")).toBe("exempel.se");
      expect(parsed.searchParams.get("target_type")).toBe("root_domain");
      return response(BACKLINKS);
    });
    const report = await requestBacklinksOverview(
      { domain: "https://www.exempel.se" },
      fetchImpl as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(report).toEqual({
      ok: true,
      domain: "exempel.se",
      ascore: "42",
      total: "1880",
      referringDomains: "310",
      urls: "940",
    });
  });

  it("turns the vendor ERROR format into a failed report", async () => {
    const wrongKey = await requestDomainOverview(
      { domain: "exempel.se" },
      (async () => response("ERROR 120 :: WRONG KEY - ID PAIR")) as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(wrongKey.ok).toBe(false);
    if (!wrongKey.ok) expect(wrongKey.reason).toContain("120");

    const nothing = await requestOrganicKeywords(
      { domain: "exempel.se" },
      (async () => response("ERROR 50 :: NOTHING FOUND")) as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(nothing.ok).toBe(false);
    if (!nothing.ok) expect(nothing.reason).toMatch(/not found/i);
  });

  it("fails closed on bad HTTP, unreadable body and network errors", async () => {
    const http = await requestDomainOverview(
      { domain: "exempel.se" },
      (async () => response("nope", 503)) as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(http.ok).toBe(false);
    if (!http.ok) expect(http.reason).toContain("503");

    const empty = await requestBacklinksOverview(
      { domain: "exempel.se" },
      (async () => response("")) as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(empty.ok).toBe(false);

    const down = await requestDomainOverview(
      { domain: "exempel.se" },
      (async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(down.ok).toBe(false);
    if (!down.ok) expect(down.reason).toMatch(/could not be reached/i);
  });

  it("refuses a broken domain without calling the vendor", async () => {
    const fetchImpl = vi.fn();
    const report = await requestDomainOverview(
      { domain: "inte en domän" },
      fetchImpl as unknown as typeof fetch,
      { SEMRUSH_API_KEY: "k" },
    );
    expect(report.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
