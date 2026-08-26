import { clipSpeechText } from "../platform/tts.ts";
import type { Agreement } from "./agreements.ts";

/** Spoken underlag. Not a legal reading and not a new contract. */
export function agreementSpeechText(
  agreement: Pick<Agreement, "title" | "counterparty" | "body" | "clauses">,
): string {
  const clauses = agreement.clauses.map((clause) => `${clause.heading}. ${clause.text}`);
  return clipSpeechText(
    [agreement.title, `Till ${agreement.counterparty}.`, agreement.body, ...clauses]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" "),
  );
}
