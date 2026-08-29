/**
 * Thin web-visibility channel backed by Semrush. Products call this — they do
 * not talk to Semrush themselves. Constitution art. 8. Fail closed without
 * `SEMRUSH_API_KEY`; never live-call the vendor from tests or page load.
 *
 * Vendor numbers are passed through verbatim as strings. The system never
 * invents traffic, ranks or scores. Capability names stay vendor-free
 * (`keywords`, `backlinks`) — Semrush is a channel, not a product.
 */

export const WEBINTEL_PRODUCTION_BASE = "https://api.semrush.com";
export const WEBINTEL_DEFAULT_DATABASE = "se";

/** domain_ranks costs 10 units. Booked by the caller before the request. */
export const WEBINTEL_DOMAIN_RANKS_UNITS = 10;
/** domain_organic costs 10 units per line. Five lines is the alpha default. */
export const WEBINTEL_ORGANIC_LINE_UNITS = 10;
export const WEBINTEL_ORGANIC_DEFAULT_LIMIT = 5;
/** backlinks_overview costs 40 units. */
export const WEBINTEL_BACKLINKS_UNITS = 40;

export type WebIntelReport =
  | {
      ok: true;
      domain: string;
      /** Semrush rank in the chosen database, verbatim. */
      rank: string | null;
      organicKeywords: string | null;
      organicTraffic: string | null;
      adwordsKeywords: string | null;
    }
  | {
      ok: false;
      domain: string | null;
      rank: null;
      organicKeywords: null;
      organicTraffic: null;
      adwordsKeywords: null;
      reason: string;
    };

export type OrganicKeywordRow = {
  phrase: string;
  position: string | null;
  volume: string | null;
  difficulty: string | null;
  traffic: string | null;
};

export type OrganicKeywordsReport =
  | { ok: true; domain: string; keywords: OrganicKeywordRow[] }
  | { ok: false; domain: string | null; keywords: []; reason: string };

export type BacklinksReport =
  | {
      ok: true;
      domain: string;
      ascore: string | null;
      total: string | null;
      referringDomains: string | null;
      urls: string | null;
    }
  | {
      ok: false;
      domain: string | null;
      ascore: null;
      total: null;
      referringDomains: null;
      urls: null;
      reason: string;
    };

export function webintelApiKey(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return env.SEMRUSH_API_KEY?.trim() || null;
}

export function webintelConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return webintelApiKey(env) !== null;
}

export function webintelBaseUrl(env: Record<string, string | undefined> = process.env): string {
  const override = env.SEMRUSH_BASE_URL?.trim().replace(/\/+$/, "");
  return override || WEBINTEL_PRODUCTION_BASE;
}

export function webintelDatabase(env: Record<string, string | undefined> = process.env): string {
  return env.SEMRUSH_DATABASE?.trim().toLowerCase() || WEBINTEL_DEFAULT_DATABASE;
}

/** `https://www.example.se/path` → `example.se`. Null when it is not a domain. */
export function normalizeDomain(value: string): string | null {
  let raw = value.trim().toLowerCase();
  if (!raw) return null;
  raw = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  raw = raw.split(/[/?#]/, 1)[0]!;
  raw = raw.split("@").pop()!;
  raw = raw.split(":", 1)[0]!;
  raw = raw.replace(/^www\./, "");
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(raw)) return null;
  return raw;
}

function failedOverview(reason: string, domain: string | null = null): WebIntelReport {
  return {
    ok: false,
    domain,
    rank: null,
    organicKeywords: null,
    organicTraffic: null,
    adwordsKeywords: null,
    reason,
  };
}

function failedKeywords(reason: string, domain: string | null = null): OrganicKeywordsReport {
  return { ok: false, domain, keywords: [], reason };
}

function failedBacklinks(reason: string, domain: string | null = null): BacklinksReport {
  return {
    ok: false,
    domain,
    ascore: null,
    total: null,
    referringDomains: null,
    urls: null,
    reason,
  };
}

function cell(row: Record<string, string>, ...names: string[]): string | null {
  for (const name of names) {
    const value = row[name];
    if (value != null && value !== "") return value;
  }
  return null;
}

/** Semrush CSV: header row, then one or more data rows, semicolon-separated. */
export function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(";").map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(";").map((item) => item.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) row[header] = cells[index] ?? "";
    });
    return row;
  });
}

type VendorText = { ok: true; text: string } | { ok: false; reason: string };

async function semrushQuery(
  params: Record<string, string>,
  fetchImpl: typeof fetch,
  env: Record<string, string | undefined>,
): Promise<VendorText> {
  const key = webintelApiKey(env);
  if (!key) {
    return { ok: false, reason: "No search-visibility source is connected. Nothing is fetched." };
  }
  const query = new URLSearchParams({ ...params, key });
  try {
    const response = await fetchImpl(`${webintelBaseUrl(env)}/?${query.toString()}`, {
      headers: { accept: "text/plain" },
    });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false, reason: `The search-visibility source responded ${response.status}.` };
    }
    // Semrush reports errors as `ERROR 120 :: WRONG KEY` with HTTP 200.
    const vendorError = /^ERROR\s+(\d+)\s*::\s*(.*)$/i.exec(text.trim());
    if (vendorError) {
      const detail = vendorError[2]?.trim();
      return {
        ok: false,
        reason: /NOTHING FOUND/i.test(detail ?? "")
          ? "The domain was not found at the search-visibility source."
          : `The search-visibility source said no (${vendorError[1]}${detail ? ` ${detail}` : ""}).`,
      };
    }
    return { ok: true, text };
  } catch {
    return { ok: false, reason: "The search-visibility source could not be reached." };
  }
}

export async function requestDomainOverview(
  input: { domain: string },
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<WebIntelReport> {
  const domain = normalizeDomain(input.domain);
  if (!domain) return failedOverview("The domain cannot be used.");
  const result = await semrushQuery(
    {
      type: "domain_ranks",
      domain,
      database: webintelDatabase(env),
      export_columns: "Dn,Rk,Or,Ot,Ad",
    },
    fetchImpl,
    env,
  );
  if (!result.ok) return failedOverview(result.reason, domain);
  const row = parseCsvRows(result.text)[0];
  if (!row)
    return failedOverview("The search-visibility source returned nothing readable.", domain);
  return {
    ok: true,
    domain: cell(row, "Domain", "Dn") || domain,
    rank: cell(row, "Rank", "Rk"),
    organicKeywords: cell(row, "Organic Keywords", "Or"),
    organicTraffic: cell(row, "Organic Traffic", "Ot"),
    adwordsKeywords: cell(row, "Adwords Keywords", "Ad"),
  };
}

/**
 * Top organic keywords for a domain. Capability name: `keywords`.
 * Numbers stay verbatim. Callers book `limit * WEBINTEL_ORGANIC_LINE_UNITS` first.
 */
export async function requestOrganicKeywords(
  input: { domain: string; limit?: number },
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<OrganicKeywordsReport> {
  const domain = normalizeDomain(input.domain);
  if (!domain) return failedKeywords("The domain cannot be used.");
  const limit = Math.max(1, Math.min(input.limit ?? WEBINTEL_ORGANIC_DEFAULT_LIMIT, 20));
  const result = await semrushQuery(
    {
      type: "domain_organic",
      domain,
      database: webintelDatabase(env),
      display_limit: String(limit),
      export_columns: "Ph,Po,Nq,Kd,Tr",
    },
    fetchImpl,
    env,
  );
  if (!result.ok) return failedKeywords(result.reason, domain);
  const rows = parseCsvRows(result.text);
  if (rows.length === 0) {
    return failedKeywords("The search-visibility source returned nothing readable.", domain);
  }
  return {
    ok: true,
    domain,
    keywords: rows
      .map((row) => ({
        phrase: cell(row, "Keyword", "Ph") ?? "",
        position: cell(row, "Position", "Po"),
        volume: cell(row, "Search Volume", "Nq"),
        difficulty: cell(row, "Keyword Difficulty Index", "Kd"),
        traffic: cell(row, "Traffic", "Tr"),
      }))
      .filter((row) => row.phrase.length > 0),
  };
}

/**
 * Backlink baseline for a root domain. Capability name: `backlinks`.
 * Callers book `WEBINTEL_BACKLINKS_UNITS` first.
 */
export async function requestBacklinksOverview(
  input: { domain: string },
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<BacklinksReport> {
  const domain = normalizeDomain(input.domain);
  if (!domain) return failedBacklinks("The domain cannot be used.");
  const result = await semrushQuery(
    {
      type: "backlinks_overview",
      target: domain,
      target_type: "root_domain",
      export_columns: "ascore,total,domains_num,urls_num",
    },
    fetchImpl,
    env,
  );
  if (!result.ok) return failedBacklinks(result.reason, domain);
  const row = parseCsvRows(result.text)[0];
  if (!row)
    return failedBacklinks("The search-visibility source returned nothing readable.", domain);
  return {
    ok: true,
    domain,
    ascore: cell(row, "ascore", "Authority Score"),
    total: cell(row, "total", "Total"),
    referringDomains: cell(row, "domains_num", "Domains", "referring_domains"),
    urls: cell(row, "urls_num", "URLs"),
  };
}
