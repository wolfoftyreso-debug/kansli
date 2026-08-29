/**
 * Thin credit-report channel. Products call this — they do not talk to
 * Creditsafe themselves. Constitution art. 8.
 */

import { digitsOfOrgNumber } from "./org-number.ts";

export const CREDIT_PRODUCTION_BASE = "https://connect.creditsafe.com/v1";
export const CREDIT_SANDBOX_BASE = "https://connect.sandbox.creditsafe.com/v1";

export type CreditReport =
  | {
      ok: true;
      providerRef: string;
      vendorName: string | null;
      vendorScore: string | null;
      vendorLimit: string | null;
    }
  | {
      ok: false;
      providerRef: string | null;
      vendorName: null;
      vendorScore: null;
      vendorLimit: null;
      reason: string;
    };

export function creditCredentials(
  env: Record<string, string | undefined> = process.env,
): { username: string; password: string } | null {
  const username = env.CREDITSAFE_USERNAME?.trim() || "";
  const password = env.CREDITSAFE_PASSWORD?.trim() || "";
  if (!username || !password) return null;
  return { username, password };
}

export function creditConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return creditCredentials(env) !== null;
}

export function creditBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const override = env.CREDITSAFE_BASE_URL?.trim().replace(/\/+$/, "");
  if (override) return override;
  if (env.CREDITSAFE_SANDBOX === "true") return CREDIT_SANDBOX_BASE;
  return CREDIT_PRODUCTION_BASE;
}

function failed(reason: string, providerRef: string | null = null): CreditReport {
  return {
    ok: false,
    providerRef,
    vendorName: null,
    vendorScore: null,
    vendorLimit: null,
    reason,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function nested(root: Record<string, unknown> | null, path: string[]): unknown {
  let current: unknown = root;
  for (const key of path) {
    const record = asRecord(current);
    if (!record) return null;
    current = record[key];
  }
  return current;
}

function extractVendorName(
  report: Record<string, unknown> | null,
  fallback: string | null,
): string | null {
  return asString(nested(report, ["companySummary", "businessName"])) || fallback;
}

function extractVendorScore(report: Record<string, unknown> | null): string | null {
  return (
    asString(nested(report, ["creditScore", "currentCreditRating", "providerValue", "value"])) ||
    asString(nested(report, ["creditScore", "currentCreditRating", "commonValue"])) ||
    asString(nested(report, ["companySummary", "creditRating", "providerValue", "value"])) ||
    asString(nested(report, ["companySummary", "creditRating", "commonValue"]))
  );
}

function extractVendorLimit(report: Record<string, unknown> | null): string | null {
  const limit =
    asRecord(nested(report, ["creditScore", "currentContractLimit"])) ||
    asRecord(nested(report, ["companySummary", "creditRating", "creditLimit"]));
  if (!limit) return null;
  const value = asString(limit.value);
  if (!value) return null;
  const currency = asString(limit.currency);
  return currency ? `${value} ${currency}` : value;
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  try {
    return asRecord(JSON.parse(text));
  } catch {
    return null;
  }
}

export async function requestCompanyCredit(
  input: { orgNumber: string },
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<CreditReport> {
  const creds = creditCredentials(env);
  if (!creds) {
    return failed("No credit bureau is connected. The report is not fetched.");
  }
  const regNo = digitsOfOrgNumber(input.orgNumber);
  if (regNo.length !== 10) {
    return failed("The organisation number cannot be used.");
  }
  const base = creditBaseUrl(env);
  try {
    const authResponse = await fetchImpl(`${base}/authenticate`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ username: creds.username, password: creds.password }),
    });
    if (!authResponse.ok) {
      return failed(`The credit bureau responded ${authResponse.status}.`);
    }
    const authBody = await readJson(authResponse);
    const token = asString(authBody?.token);
    if (!token) {
      return failed("The credit bureau did not return a key.");
    }

    const searchResponse = await fetchImpl(
      `${base}/companies?countries=SE&pageSize=1&regNo=${encodeURIComponent(regNo)}`,
      {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      },
    );
    if (!searchResponse.ok) {
      return failed(`The credit bureau responded ${searchResponse.status}.`);
    }
    const searchBody = await readJson(searchResponse);
    const companies = Array.isArray(searchBody?.companies) ? searchBody.companies : [];
    const first = asRecord(companies[0]);
    const connectId = asString(first?.id);
    if (!connectId) {
      return failed("The company was not found at the credit bureau.");
    }
    const searchName = asString(first?.name);

    const reportResponse = await fetchImpl(`${base}/companies/${encodeURIComponent(connectId)}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
    });
    if (!reportResponse.ok) {
      return failed(`The credit bureau responded ${reportResponse.status}.`, connectId);
    }
    const reportBody = await readJson(reportResponse);
    const report = asRecord(reportBody?.report);
    return {
      ok: true,
      providerRef: connectId,
      vendorName: extractVendorName(report, searchName),
      vendorScore: extractVendorScore(report),
      vendorLimit: extractVendorLimit(report),
    };
  } catch {
    return failed("The credit bureau could not be reached.");
  }
}
