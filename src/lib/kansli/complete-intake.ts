import { takePasswordOnce } from "./intakes.ts";
import { submitIntake } from "./submit-intake.ts";
import { ownerDatabaseUrl } from "../platform/env.ts";
import { orgNumberError } from "../platform/org-number.ts";
import { getRuntime } from "../platform/runtime.ts";
import type { IntakeReveal } from "./intake-reveal.ts";

export function intakeOrgNumberPath(form: FormData): string | null {
  const rawOrgNumber = String(form.get("orgNumber") ?? "").trim();
  if (rawOrgNumber && orgNumberError(rawOrgNumber)) return "/upphandling?fel=orgnr";
  return null;
}

export async function completeIntakeSubmit(form: FormData): Promise<{
  path: string;
  reveal: IntakeReveal | null;
}> {
  const blocked = intakeOrgNumberPath(form);
  if (blocked) return { path: blocked, reveal: null };
  const { pool, events } = getRuntime();
  const result = await submitIntake({
    pool,
    events,
    form,
    ownerUrl: ownerDatabaseUrl(),
  });
  let reveal: IntakeReveal | null = null;
  if (result.passwordOnce) {
    await takePasswordOnce(pool, result.intake.id);
    reveal = { intakeId: result.intake.id, passwordOnce: result.passwordOnce };
  }
  return {
    path: `/upphandling/bekraftelse?id=${encodeURIComponent(result.intake.id)}`,
    reveal,
  };
}
