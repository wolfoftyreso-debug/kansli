/**
 * Verdicts — what the system is allowed to tell a company.
 *
 * The hard product rule lives here: the system may never say "you have a right
 * to this job" unless that right is derivable from a verifiable legal or
 * contractual fact. `RIGHT` therefore cannot be constructed without a
 * `LegalBasis` pointing at the contract that creates it. That is enforced by
 * `decideVerdict` below and covered by tests — it is not a convention.
 */

import type { Caveat } from "./regulations";
import type { SourceRef } from "./ontology";

export type Verdict =
  /** A verifiable right to the work, e.g. rank-1 call-off under a live framework. */
  | "RIGHT"
  /** Meets the stated requirements and can act on the opportunity now. */
  | "ELIGIBLE"
  /** Could participate after a concrete, named remedy. */
  | "POSSIBLE"
  /** Qualified, but the work is decided in open competition. */
  | "COMPETITIVE"
  /** Fails at least one mandatory requirement, or is blocked procedurally. */
  | "NOT_ELIGIBLE"
  /** Not enough information to decide. Never guessed around. */
  | "UNKNOWN";

export const VERDICT_LABEL: Record<Verdict, string> = {
  RIGHT: "Rättighet",
  ELIGIBLE: "Kvalificerad",
  POSSIBLE: "Möjlig med åtgärd",
  COMPETITIVE: "Konkurrensutsatt",
  NOT_ELIGIBLE: "Ej kvalificerad",
  UNKNOWN: "Okänt",
};

/** Traffic light shown in listings. `UNKNOWN` is grey, never optimistically blue. */
export type Signal = "blue" | "yellow" | "red" | "grey";

export const VERDICT_SIGNAL: Record<Verdict, Signal> = {
  RIGHT: "blue",
  ELIGIBLE: "blue",
  COMPETITIVE: "blue",
  POSSIBLE: "yellow",
  NOT_ELIGIBLE: "red",
  UNKNOWN: "grey",
};

/**
 * The only thing that can justify `RIGHT`. Every field is required: a right
 * without a contract reference and a source is not a right, it is a guess.
 */
export interface LegalBasis {
  /** The contract or framework that creates the right. */
  contractId: string;
  /** Short statement of *why* it follows, in the user's language. */
  reason: string;
  source: SourceRef;
}

/* ------------------------------------------------------------------ */
/* The two axes a verdict is built from                                */
/* ------------------------------------------------------------------ */

/** Can the company reach this work at all, procedurally? */
export type AccessStatus =
  /** A live contract gives the company the work directly. */
  | "granted"
  /** Open to apply or join right now (DPS admission, open notice). */
  | "open"
  /** Reachable, but only by winning against others. */
  | "competitive"
  /** A route may exist but the buyer decides, e.g. a possible direct award. */
  | "discretionary"
  /** An existing contract held by someone else routes this purchase. */
  | "blocked"
  /** Procedure or timing not established. */
  | "unknown";

/** Does the company meet the stated requirements? */
export type QualificationStatus =
  | "qualified"
  /** One or more gaps that a named action can close. */
  | "remediable"
  /** At least one mandatory requirement is definitively unmet. */
  | "failed"
  /** Facts missing; cannot be decided. */
  | "unknown";

export interface VerdictInput {
  access: AccessStatus;
  qualification: QualificationStatus;
  /** Present only when `access === "granted"`. */
  legalBasis?: LegalBasis;
  /**
   * The access engine's own account of the situation. Used verbatim when access
   * is what decided the verdict — "an award decision has been made" and "a
   * framework you are not party to routes this" are both blocks, and telling a
   * user the wrong one is a small lie that destroys trust in the rest.
   */
  accessExplanation?: string;
  /**
   * Kvalificeringsmotorns egen förklaring, när något annat än kraven själva
   * avgjorde. "Uppgifter saknas i profilen" och "kraven är inte inlästa" är
   * båda `unknown`, men det är två helt olika saker att göra åt saken — den
   * ena löser företaget själv på en minut, den andra kan det inte alls.
   */
  qualificationExplanation?: string;
}

export interface VerdictDecision {
  verdict: Verdict;
  /** Why this verdict and not another, in one sentence. */
  rationale: string;
  legalBasis?: LegalBasis;
  caveats: Caveat[];
}

/**
 * Resolves the two axes into a single verdict.
 *
 * Order matters. A definitive requirement failure outranks everything, because
 * telling someone a blocked door is open wastes their week. Missing facts
 * outrank optimism, because `UNKNOWN` is a usable answer and a wrong `ELIGIBLE`
 * is not.
 */
export function decideVerdict(input: VerdictInput): VerdictDecision {
  const { access, qualification, legalBasis, accessExplanation, qualificationExplanation } = input;
  const caveats: Caveat[] = [];

  if (qualification === "failed") {
    return {
      verdict: "NOT_ELIGIBLE",
      rationale: "Minst ett obligatoriskt krav är inte uppfyllt.",
      caveats,
    };
  }

  if (access === "blocked") {
    return {
      verdict: "NOT_ELIGIBLE",
      rationale: accessExplanation ?? "Uppdraget är inte åtkomligt för företaget.",
      caveats,
    };
  }

  if (access === "unknown" || qualification === "unknown") {
    return {
      verdict: "UNKNOWN",
      rationale:
        access === "unknown"
          ? (accessExplanation ?? "Förfarande eller tidplan är inte fastställd.")
          : (qualificationExplanation ?? "Uppgifter saknas för att avgöra om kraven är uppfyllda."),
      caveats,
    };
  }

  if (access === "granted") {
    // The guard. `granted` without a provable basis is downgraded, never trusted.
    if (!legalBasis) {
      return {
        verdict: "UNKNOWN",
        rationale:
          "En rättighet har påståtts men kan inte härledas till ett verifierbart avtal. " +
          "Systemet redovisar därför ingen rättighet.",
        caveats,
      };
    }
    if (qualification === "remediable") {
      return {
        verdict: "POSSIBLE",
        rationale:
          "Avtalet ger företaget tillgång till uppdraget, men något krav behöver åtgärdas först.",
        legalBasis,
        caveats,
      };
    }
    return {
      verdict: "RIGHT",
      rationale: legalBasis.reason,
      legalBasis,
      caveats,
    };
  }

  if (qualification === "remediable") {
    return {
      verdict: "POSSIBLE",
      rationale: "Företaget kan delta efter en konkret åtgärd.",
      caveats,
    };
  }

  if (access === "discretionary") {
    return {
      verdict: "POSSIBLE",
      rationale:
        "Företaget uppfyller kraven, men om köpet får göras på detta sätt avgörs av den " +
        "upphandlande organisationen.",
      caveats,
    };
  }

  if (access === "open") {
    return {
      verdict: "ELIGIBLE",
      rationale: "Företaget uppfyller de redovisade kraven och kan ansöka nu.",
      caveats,
    };
  }

  return {
    verdict: "COMPETITIVE",
    rationale: "Företaget uppfyller kraven. Uppdraget avgörs i konkurrens.",
    caveats,
  };
}
