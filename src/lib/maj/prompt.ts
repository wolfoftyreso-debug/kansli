import type { MajAction } from "./engine.ts";
import type { MajProject } from "./projects.ts";

/**
 * The Implementation Prompt Compiler. Stack-agnostic by design: we do not
 * know the customer's codebase, so the prompt always starts by instructing
 * the coding agent to inspect reality before changing anything.
 */
export function compileImplementationPrompt(input: {
  project: MajProject;
  action: MajAction;
}): string {
  const { project, action } = input;
  const evidence = JSON.stringify(action.evidence, null, 2);
  return [
    "IMPLEMENTATION BRIEF — MAJ",
    "",
    "Inspect the actual codebase, routing model, data model,",
    "rendering, design system and existing search implementation first.",
    "Do not change architecture on assumptions. Then implement the",
    "measurable goal below without building a parallel architecture.",
    "",
    "PROBLEM",
    action.title,
    "",
    "WHY",
    action.why,
    "",
    "DOMAIN AND MARKET",
    `${project.domain} · ${project.market} · ${project.language}`,
    "",
    "EVIDENCE (verbatim source data)",
    evidence,
    "",
    "ASSESSMENT",
    `Expected impact: ${action.expectedImpact} · Risk: ${action.risk} · Confidence: ${action.confidence} %`,
    "",
    "ACCEPTANCE",
    "1. The goal above is met and verified against the source data.",
    "2. No existing pages lose indexing, canonical or structured data.",
    "3. The change is reversible and documented.",
    "",
    "REGRESSION",
    "Run the existing test suite. Add a test that locks the new behaviour.",
    "",
    "REPORT BACK",
    "Reply with: what changed, where, why, test results, and a",
    "machine-readable summary that follows release.v1.",
  ].join("\n");
}
