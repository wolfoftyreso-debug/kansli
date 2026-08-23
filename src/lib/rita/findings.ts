export interface RitaFinding {
  id: string;
  title: string;
  status: string;
  rationale: string;
  recommendedAction: string;
  risk: string;
  category: string;
}

export function findingsFromAnalysis(result: unknown): RitaFinding[] {
  const opportunities = opportunitiesFrom(result);
  return opportunities.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const title = String(row.title ?? "").trim();
    if (!id || !title) return [];
    return [
      {
        id,
        title,
        status: String(row.status ?? "identified"),
        rationale: String(row.rationale ?? ""),
        recommendedAction: String(row.recommended_action ?? ""),
        risk: String(row.risk ?? ""),
        category: String(row.category ?? ""),
      },
    ];
  });
}

export function analysisSummary(result: unknown): string | null {
  const inner = innerResult(result);
  if (!inner) return null;
  const summary = inner["summary"];
  if (!summary || typeof summary !== "object") return null;
  const row = summary as Record<string, unknown>;
  const identified = Number(row.identified_opportunities ?? 0);
  const high = Number(row.high_priority_count ?? 0);
  const nothing = Boolean(row.found_nothing);
  if (nothing) return "Motorn hittade inget att rapportera i underlaget.";
  return `${identified} fynd, varav ${high} med hög prioritet.`;
}

function opportunitiesFrom(result: unknown): unknown[] {
  const inner = innerResult(result);
  const list = inner?.["opportunities"];
  return Array.isArray(list) ? list : [];
}

function innerResult(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== "object") return null;
  const obj = result as Record<string, unknown>;
  if (obj.result && typeof obj.result === "object") return obj.result as Record<string, unknown>;
  if (Array.isArray(obj.opportunities)) return obj;
  return obj;
}
