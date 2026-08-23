/**
 * The gap/drift engine.
 *
 * Compares the Product Capability Inventory against the Documentation Coverage
 * Matrix and produces the answers the handbook spec requires — above all,
 * "what parts of ALVA are currently undocumented?" — plus a human-readable
 * gap report. It never treats unknown coverage as complete coverage.
 */

import {
  DEFAULT_STATUS,
  type CapabilityRecord,
  type CoverageMatrix,
  type CoverageRecord,
  type CoverageStatus,
  type Inventory,
} from "./model.ts";

export interface CapabilityCoverage {
  capability: CapabilityRecord;
  coverage: CoverageRecord | null;
  status: CoverageStatus;
}

export interface GapReport {
  totals: {
    capabilities: number;
    inRepo: number;
    externalRepo: number;
    notPresent: number;
    byStatus: Record<CoverageStatus, number>;
  };
  /** The fundamental question: capabilities with no usable documentation. */
  undocumented: CapabilityCoverage[];
  draftOrPartial: CapabilityCoverage[];
  documented: CapabilityCoverage[];
  verificationRequired: CapabilityCoverage[];
  outdated: CapabilityCoverage[];
  /** Requested/asserted but not verifiable from this repository. */
  notPresent: CapabilityCoverage[];
  externalRepo: CapabilityCoverage[];
  /** In-repo capabilities lacking a contextual-help entry. */
  missingContextualHelp: CapabilityCoverage[];
  /** Documented capabilities whose translations are not done. */
  untranslated: CapabilityCoverage[];
  /** Coverage records that reference an unknown capability id. */
  orphanCoverage: CoverageRecord[];
}

function emptyStatusCounts(): Record<CoverageStatus, number> {
  return {
    UNDOCUMENTED: 0,
    DRAFT: 0,
    PARTIALLY_DOCUMENTED: 0,
    DOCUMENTED: 0,
    VERIFICATION_REQUIRED: 0,
    OUTDATED: 0,
    ARCHIVED: 0,
  };
}

export function joinCoverage(inv: Inventory, matrix: CoverageMatrix): CapabilityCoverage[] {
  const byId = new Map(matrix.records.map((r) => [r.capabilityId, r]));
  return inv.capabilities.map((capability) => {
    const coverage = byId.get(capability.id) ?? null;
    return { capability, coverage, status: coverage?.status ?? DEFAULT_STATUS };
  });
}

/** The headline query the spec calls a fundamental requirement. */
export function whatIsUndocumented(inv: Inventory, matrix: CoverageMatrix): CapabilityCoverage[] {
  return joinCoverage(inv, matrix).filter((c) => c.status === "UNDOCUMENTED");
}

export function computeGaps(inv: Inventory, matrix: CoverageMatrix): GapReport {
  const joined = joinCoverage(inv, matrix);
  const knownIds = new Set(inv.capabilities.map((c) => c.id));

  const byStatus = emptyStatusCounts();
  for (const c of joined) byStatus[c.status] += 1;

  const isUndocumented = (c: CapabilityCoverage) => c.status === "UNDOCUMENTED";
  const isDraftOrPartial = (c: CapabilityCoverage) =>
    c.status === "DRAFT" || c.status === "PARTIALLY_DOCUMENTED";

  return {
    totals: {
      capabilities: inv.capabilities.length,
      inRepo: inv.capabilities.filter((c) => c.presence === "IN_REPO").length,
      externalRepo: inv.capabilities.filter((c) => c.presence === "EXTERNAL_REPO").length,
      notPresent: inv.capabilities.filter((c) => c.presence === "NOT_PRESENT").length,
      byStatus,
    },
    undocumented: joined.filter(isUndocumented),
    draftOrPartial: joined.filter(isDraftOrPartial),
    documented: joined.filter((c) => c.status === "DOCUMENTED"),
    verificationRequired: joined.filter((c) => c.status === "VERIFICATION_REQUIRED"),
    outdated: joined.filter((c) => c.status === "OUTDATED"),
    notPresent: joined.filter((c) => c.capability.presence === "NOT_PRESENT"),
    externalRepo: joined.filter((c) => c.capability.presence === "EXTERNAL_REPO"),
    missingContextualHelp: joined.filter(
      (c) => c.capability.presence === "IN_REPO" && !(c.coverage?.contextualHelp ?? false),
    ),
    untranslated: joined.filter(
      (c) =>
        c.status === "DOCUMENTED" &&
        (c.coverage?.translationStatus ?? "NOT_TRANSLATED") === "NOT_TRANSLATED",
    ),
    orphanCoverage: matrix.records.filter((r) => !knownIds.has(r.capabilityId)),
  };
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function line(c: CapabilityCoverage): string {
  const cap = c.capability;
  const refs = [...cap.routeRefs, ...cap.componentRefs].slice(0, 2).join(", ");
  const gaps = cap.knownGaps.length ? ` — _${cap.knownGaps.join("; ")}_` : "";
  return `- \`${cap.id}\` — ${cap.name} (${cap.area}; ${c.status}${refs ? `; ${refs}` : ""})${gaps}`;
}

function section(title: string, items: CapabilityCoverage[]): string {
  if (items.length === 0) return `### ${title}\n\n_Inga._\n`;
  return `### ${title} (${items.length})\n\n${items.map(line).join("\n")}\n`;
}

export function renderGapReport(inv: Inventory, matrix: CoverageMatrix): string {
  const g = computeGaps(inv, matrix);
  const s = g.totals.byStatus;
  const pct = (n: number) =>
    g.totals.capabilities ? Math.round((n / g.totals.capabilities) * 100) : 0;

  return `# ALVA Documentation Gap Report

> Auto-genererad av \`@pixdrift/doc-intel\` från den maskinläsbara
> kapabilitetsinventeringen och täckningsmatrisen. **Kör inte handboken från
> antaganden** — denna rapport är kontrollpunkten över vad som faktiskt finns,
> vad som är dokumenterat, och vad som inte kan verifieras härifrån.

Genererad: ${new Date().toISOString()}
Repo: ${inv.repo}${inv.commit ? ` @ ${inv.commit}` : ""}
${inv.note ? `\n> ${inv.note}\n` : ""}
## Sammanfattning

| Mått | Antal |
| --- | ---: |
| Kapabiliteter totalt | ${g.totals.capabilities} |
| I detta repo (\`IN_REPO\`) | ${g.totals.inRepo} |
| I annat repo (\`EXTERNAL_REPO\`) | ${g.totals.externalRepo} |
| Ej närvarande här (\`NOT_PRESENT\`) | ${g.totals.notPresent} |
| DOCUMENTED | ${s.DOCUMENTED} (${pct(s.DOCUMENTED)}%) |
| PARTIALLY_DOCUMENTED | ${s.PARTIALLY_DOCUMENTED} |
| DRAFT | ${s.DRAFT} |
| UNDOCUMENTED | ${s.UNDOCUMENTED} (${pct(s.UNDOCUMENTED)}%) |
| VERIFICATION_REQUIRED | ${s.VERIFICATION_REQUIRED} |
| OUTDATED | ${s.OUTDATED} |
| ARCHIVED | ${s.ARCHIVED} |

## "Vad i ALVA är odokumenterat just nu?"

${g.undocumented.length === 0 ? "_Inget odokumenterat._" : g.undocumented.map(line).join("\n")}

## Kan inte verifieras härifrån (produktkällan saknas i detta repo)

Dessa efterfrågades i uppdraget men **ALVA-produktens källkod finns inte i detta
repo** (den bor i eget repo). De kan därför varken inventeras, screenshottas
eller dokumenteras mot verklig evidens härifrån — de är listade så att okänd
täckning aldrig maskeras som komplett.

${section("NOT_PRESENT", g.notPresent)}
${section("EXTERNAL_REPO", g.externalRepo)}
## Delvis dokumenterat / utkast

${section("DRAFT / PARTIALLY_DOCUMENTED", g.draftOrPartial)}
## Kräver verifiering / föråldrat

${section("VERIFICATION_REQUIRED", g.verificationRequired)}
${section("OUTDATED", g.outdated)}
## Saknar kontextuell hjälp (in-repo)

${section("Utan contextual help", g.missingContextualHelp)}
## Dokumenterat

${section("DOCUMENTED", g.documented)}
${
  g.orphanCoverage.length
    ? `## Föräldralösa täckningsposter (okänt capability-id)\n\n${g.orphanCoverage
        .map((r) => `- \`${r.capabilityId}\` (${r.status})`)
        .join("\n")}\n`
    : ""
}
---

_Nästa steg för att gå från denna kontrollpunkt till faktisk handbok kräver
åtkomst till ALVA-produktens repo + en körbar ALVA-instans (för snapshot-
pipelinen). Se \`docs/DOCUMENTATION-INTELLIGENCE.md\`._
`;
}
