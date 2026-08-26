/**
 * Thin web-visibility channel backed by Semrush. Products call this — they do
 * not talk to Semrush themselves. Constitution art. 8. Fail closed without
 * `SEMRUSH_API_KEY`; never live-call the vendor from tests or page load.
 *
 * Vendor numbers are passed through verbatim as strings. The system never
 * invents traffic, ranks or scores.
 */

export const WEBINTEL_PRODUCTION_BASE = "https://api.semrush.com";
export const WEBINTEL_DEFAULT_DATABASE = "se";

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

export function webintelApiKey(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return env.SEMRUSH_API_KEY?.trim() || null;
}

export function webintelConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
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

function failed(reason: string, domain: string | null = null): WebIntelReport {
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

/** Semrush CSV: `Domain;Rank;Organic Keywords;…` — one header row, one data row. */
function parseCsv(text: string): Record<string, string> | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0]!.split(";").map((cell) => cell.trim());
  const cells = lines[1]!.split(";").map((cell) => cell.trim());
  const row: Record<string, string> = {};
  headers.forEach((header, index) => {
    if (header && cells[index]) row[header] = cells[index]!;
  });
  return Object.keys(row).length > 0 ? row : null;
}

export async function requestDomainOverview(
  input: { domain: string },
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<WebIntelReport> {
  const key = webintelApiKey(env);
  if (!key) {
    return failed("Ingen webbdatakälla är kopplad. Uppgifterna hämtas inte.");
  }
  const domain = normalizeDomain(input.domain);
  if (!domain) {
    return failed("Domänen går inte att använda.");
  }
  const query = new URLSearchParams({
    type: "domain_ranks",
    key,
    domain,
    database: webintelDatabase(env),
    export_columns: "Dn,Rk,Or,Ot,Ad",
  });
  try {
    const response = await fetchImpl(`${webintelBaseUrl(env)}/?${query.toString()}`, {
      headers: { accept: "text/plain" },
    });
    const text = await response.text();
    if (!response.ok) {
      return failed(`Webbdatakällan svarade ${response.status}.`, domain);
    }
    // Semrush reports errors as `ERROR 120 :: WRONG KEY` with HTTP 200.
    const vendorError = /^ERROR\s+(\d+)\s*::\s*(.*)$/i.exec(text.trim());
    if (vendorError) {
      const detail = vendorError[2]?.trim();
      return failed(
        /NOTHING FOUND/i.test(detail ?? "")
          ? "Domänen hittades inte hos webbdatakällan."
          : `Webbdatakällan sa nej (${vendorError[1]}${detail ? ` ${detail}` : ""}).`,
        domain,
      );
    }
    const row = parseCsv(text);
    if (!row) {
      return failed("Webbdatakällan gav inget läsbart svar.", domain);
    }
    return {
      ok: true,
      domain: row["Domain"] || domain,
      rank: row["Rank"] || null,
      organicKeywords: row["Organic Keywords"] || null,
      organicTraffic: row["Organic Traffic"] || null,
      adwordsKeywords: row["Adwords Keywords"] || null,
    };
  } catch {
    return failed("Webbdatakällan gick inte att nå.", domain);
  }
}
