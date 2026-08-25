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
    text: "Du bekräftar att du har läst hela underlaget.",
  },
  {
    id: "bekraftelse",
    heading: "Bekräftelse",
    text: "Bekräftelsen är en enkel digital bekräftelse. Den är inte BankID och inte en juridiskt kvalificerad e-signatur.",
  },
];

export const ACKNOWLEDGEMENT_DECLARATION =
  "Jag har läst villkoren och bekräftar underlaget. Detta är inte en juridisk e-signatur.";

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
