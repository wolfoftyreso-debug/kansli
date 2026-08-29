import { afterEach, describe, expect, it } from "vitest";
import {
  CREDIT_PRODUCTION_BASE,
  CREDIT_SANDBOX_BASE,
  creditBaseUrl,
  creditConfigured,
  requestCompanyCredit,
} from "./credit.ts";

const saved = {
  user: process.env.CREDITSAFE_USERNAME,
  pass: process.env.CREDITSAFE_PASSWORD,
  sandbox: process.env.CREDITSAFE_SANDBOX,
  base: process.env.CREDITSAFE_BASE_URL,
};

afterEach(() => {
  if (saved.user) process.env.CREDITSAFE_USERNAME = saved.user;
  else delete process.env.CREDITSAFE_USERNAME;
  if (saved.pass) process.env.CREDITSAFE_PASSWORD = saved.pass;
  else delete process.env.CREDITSAFE_PASSWORD;
  if (saved.sandbox) process.env.CREDITSAFE_SANDBOX = saved.sandbox;
  else delete process.env.CREDITSAFE_SANDBOX;
  if (saved.base) process.env.CREDITSAFE_BASE_URL = saved.base;
  else delete process.env.CREDITSAFE_BASE_URL;
});

describe("credit channel", () => {
  it("reports when the vendor is missing and never fetches", async () => {
    delete process.env.CREDITSAFE_USERNAME;
    delete process.env.CREDITSAFE_PASSWORD;
    expect(creditConfigured()).toBe(false);
    expect(creditBaseUrl()).toBe(CREDIT_PRODUCTION_BASE);
    const result = await requestCompanyCredit({ orgNumber: "556016-0680" }, async () => {
      throw new Error("should not fetch");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/No credit bureau is connected/);
  });

  it("uses sandbox or an explicit base when asked", () => {
    process.env.CREDITSAFE_SANDBOX = "true";
    expect(creditBaseUrl()).toBe(CREDIT_SANDBOX_BASE);
    process.env.CREDITSAFE_BASE_URL = "https://connect.example.test/v1/";
    expect(creditBaseUrl()).toBe("https://connect.example.test/v1");
  });

  it("authenticates, searches and reads a report without inventing missing fields", async () => {
    process.env.CREDITSAFE_USERNAME = "cs-user";
    process.env.CREDITSAFE_PASSWORD = "cs-secret-not-real";
    const calls: string[] = [];
    const result = await requestCompanyCredit({ orgNumber: "556016-0680" }, async (url, init) => {
      calls.push(`${init?.method ?? "GET"} ${String(url)}`);
      const href = String(url);
      if (href.endsWith("/authenticate")) {
        const body = JSON.parse(String(init?.body)) as { username: string; password: string };
        expect(body.username).toBe("cs-user");
        expect(body.password).toBe("cs-secret-not-real");
        return new Response(JSON.stringify({ token: "tok-1" }), { status: 200 });
      }
      if (href.includes("/companies?") && href.includes("regNo=5560160680")) {
        const headers = new Headers(init?.headers);
        expect(headers.get("authorization")).toBe("Bearer tok-1");
        return new Response(
          JSON.stringify({ companies: [{ id: "SE-X-1", name: "Exempel motpart AB" }] }),
          { status: 200 },
        );
      }
      if (href.endsWith("/companies/SE-X-1")) {
        return new Response(
          JSON.stringify({
            report: {
              companySummary: { businessName: "Exempel motpart AB" },
            },
          }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected ${href}`);
    });
    expect(calls).toEqual([
      `POST ${CREDIT_PRODUCTION_BASE}/authenticate`,
      `GET ${CREDIT_PRODUCTION_BASE}/companies?countries=SE&pageSize=1&regNo=5560160680`,
      `GET ${CREDIT_PRODUCTION_BASE}/companies/SE-X-1`,
    ]);
    expect(result).toEqual({
      ok: true,
      providerRef: "SE-X-1",
      vendorName: "Exempel motpart AB",
      vendorScore: null,
      vendorLimit: null,
    });
    expect(JSON.stringify(result)).not.toContain("cs-secret-not-real");
  });

  it("passes through vendor score and limit only when the report has them", async () => {
    process.env.CREDITSAFE_USERNAME = "cs-user";
    process.env.CREDITSAFE_PASSWORD = "cs-secret-not-real";
    const result = await requestCompanyCredit({ orgNumber: "5560160680" }, async (url) => {
      const href = String(url);
      if (href.endsWith("/authenticate")) {
        return new Response(JSON.stringify({ token: "tok-2" }), { status: 200 });
      }
      if (href.includes("/companies?")) {
        return new Response(JSON.stringify({ companies: [{ id: "SE-X-2" }] }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          report: {
            companySummary: {
              creditRating: { creditLimit: { currency: "SEK", value: "250000" } },
            },
            creditScore: {
              currentCreditRating: { commonValue: "A", providerValue: { value: "71" } },
              currentContractLimit: { currency: "SEK", value: "250000" },
            },
          },
        }),
        { status: 200 },
      );
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.vendorScore).toBe("71");
      expect(result.vendorLimit).toBe("250000 SEK");
    }
  });

  it("fails closed when the company is missing or the vendor errors", async () => {
    process.env.CREDITSAFE_USERNAME = "cs-user";
    process.env.CREDITSAFE_PASSWORD = "cs-secret-not-real";
    const missing = await requestCompanyCredit({ orgNumber: "556016-0680" }, async (url) => {
      const href = String(url);
      if (href.endsWith("/authenticate")) {
        return new Response(JSON.stringify({ token: "tok-3" }), { status: 200 });
      }
      return new Response(JSON.stringify({ companies: [] }), { status: 200 });
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toMatch(/not found at the credit bureau/);

    const denied = await requestCompanyCredit({ orgNumber: "556016-0680" }, async () => {
      return new Response("no", { status: 401 });
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toMatch(/401/);
    expect(JSON.stringify(denied)).not.toContain("cs-secret-not-real");
  });

  it("does not call the vendor for an unusable organisation number", async () => {
    process.env.CREDITSAFE_USERNAME = "cs-user";
    process.env.CREDITSAFE_PASSWORD = "cs-secret-not-real";
    const result = await requestCompanyCredit({ orgNumber: "12" }, async () => {
      throw new Error("should not fetch");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cannot be used/);
  });
});
