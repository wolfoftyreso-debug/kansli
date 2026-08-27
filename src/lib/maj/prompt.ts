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
    "IMPLEMENTATIONSUPPDRAG — MAJ",
    "",
    "Inspektera först den faktiska kodbasen, routingmodellen, datamodellen,",
    "renderingstekniken, designsystemet och befintlig SEO-implementation.",
    "Ändra inte arkitektur på antaganden. Implementera därefter följande",
    "mätbara mål utan att bygga parallell arkitektur.",
    "",
    "PROBLEM",
    action.title,
    "",
    "VARFÖR",
    action.why,
    "",
    "DOMÄN OCH MARKNAD",
    `${project.domain} · ${project.market} · ${project.language}`,
    "",
    "EVIDENS (ordagrann källdata)",
    evidence,
    "",
    "BEDÖMNING",
    `Förväntad effekt: ${action.expectedImpact} · Risk: ${action.risk} · Confidence: ${action.confidence} %`,
    "",
    "ACCEPTANSKRITERIER",
    "1. Målet ovan är uppfyllt och verifierat mot källdatan.",
    "2. Inga befintliga sidor tappar indexering, canonical eller structured data.",
    "3. Ändringen är reversibel och dokumenterad.",
    "",
    "REGRESSIONSTESTER",
    "Kör befintlig testsvit. Lägg till test som låser det nya beteendet.",
    "",
    "ÅTERRAPPORT",
    "Svara med: vad som ändrades, var, varför, testresultat och en",
    "maskinläsbar sammanfattning enligt release.v1.",
  ].join("\n");
}
