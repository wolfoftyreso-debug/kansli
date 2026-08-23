export interface AgreementClause {
  id: string;
  heading: string;
  text: string;
}

/** Demo clauses. Not a legal template and not an employment contract. */
export const DEFAULT_CLAUSES: readonly AgreementClause[] = [
  {
    id: "parter",
    heading: "Parter",
    text: "Avtalet gäller mellan den utfärdande organisationen och namngiven motpart.",
  },
  {
    id: "underlag",
    heading: "Underlag",
    text: "Motparten bekräftar att hen har läst underlaget i sin helhet innan bekräftelsen lämnas.",
  },
  {
    id: "bekraftelse",
    heading: "Bekräftelse",
    text: "Bekräftelsen är en hashad förklaring. Den är inte BankID och inte en kvalificerad elektronisk underskrift enligt eIDAS.",
  },
];

export const ACKNOWLEDGEMENT_DECLARATION =
  "Jag har läst klausulerna och bekräftar underlaget. Detta är inte en kvalificerad e-signatur.";

export function parseClauses(value: unknown): AgreementClause[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const heading = String(row.heading ?? "").trim();
    const text = String(row.text ?? "").trim();
    if (!id || !heading || !text) return [];
    return [{ id, heading, text }];
  });
}
