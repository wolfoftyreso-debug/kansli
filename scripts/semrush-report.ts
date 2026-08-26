// SEO snapshot for landvex.com through the Semrush Analytics API.
//
//   SEMRUSH_API_KEY=... npm run seo:semrush
//
// Read-only and run by hand: it spends API units (one per response line), so
// it is not part of build or CI. Databases: us (US HQ) and se (EU HQ).

import { site } from "../lib/site.ts";

const API = "https://api.semrush.com/";
const DOMAIN = new URL(site.url).hostname;
const DATABASES = ["us", "se"] as const;

const key = process.env.SEMRUSH_API_KEY?.trim();
if (!key) {
  console.error(
    "SEMRUSH_API_KEY is not set. Add it as a secret (Cursor Dashboard → Cloud Agents → Secrets) or export it in your shell.",
  );
  process.exit(1);
}

type Row = Record<string, string>;

// Semrush answers CSV with ";" separators, or a plain "ERROR n :: message"
// line for empty results and bad requests.
function parseCsv(body: string): { rows: Row[]; error?: string } {
  const text = body.trim();
  if (text.startsWith("ERROR")) return { rows: [], error: text };
  const [header, ...lines] = text.split("\n");
  if (!header) return { rows: [] };
  const columns = header.split(";");
  const rows = lines.map((line) => {
    const cells = line.split(";");
    return Object.fromEntries(columns.map((c, i) => [c, cells[i] ?? ""]));
  });
  return { rows };
}

async function call(params: Record<string, string>) {
  const url = new URL(API);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", key as string);
  const response = await fetch(url);
  const body = await response.text();
  if (!response.ok) return { rows: [], error: `HTTP ${response.status}: ${body.slice(0, 200)}` };
  return parseCsv(body);
}

function show(title: string, result: { rows: Row[]; error?: string }) {
  console.log(`\n## ${title}`);
  if (result.error) {
    // ERROR 50 means "nothing to report" for a new domain, not a failure.
    console.log(result.error.includes("NOTHING FOUND") ? "No data yet." : result.error);
    return;
  }
  if (result.rows.length === 0) {
    console.log("No data yet.");
    return;
  }
  console.table(result.rows);
}

console.log(`# Semrush snapshot for ${DOMAIN} — ${new Date().toISOString().slice(0, 10)}`);

for (const database of DATABASES) {
  show(
    `Domain overview (${database})`,
    await call({
      type: "domain_ranks",
      domain: DOMAIN,
      database,
      export_columns: "Db,Dn,Rk,Or,Ot,Oc,Ad",
    }),
  );

  show(
    `Top organic keywords (${database})`,
    await call({
      type: "domain_organic",
      domain: DOMAIN,
      database,
      display_limit: "10",
      display_sort: "tr_desc",
      export_columns: "Ph,Po,Nq,Cp,Tr",
    }),
  );
}

show(
  "Backlinks overview",
  await call({
    type: "backlinks_overview",
    target: DOMAIN,
    target_type: "root_domain",
    export_columns: "ascore,total,domains_num,ips_num",
  }),
);
