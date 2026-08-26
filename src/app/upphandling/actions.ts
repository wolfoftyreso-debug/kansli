"use server";

import { redirect } from "next/navigation";
import { takePasswordOnce } from "@/lib/kansli/intakes";
import { writeIntakeReveal } from "@/lib/kansli/intake-reveal";
import { submitIntake } from "@/lib/kansli/submit-intake";
import { ownerDatabaseUrl } from "@/lib/platform/env";
import { orgNumberError } from "@/lib/platform/org-number";
import { getRuntime } from "@/lib/platform/runtime";

export async function submitUpphandling(form: FormData) {
  const rawOrgNumber = String(form.get("orgNumber") ?? "").trim();
  if (rawOrgNumber && orgNumberError(rawOrgNumber)) {
    redirect("/upphandling?fel=orgnr");
  }
  const { pool, events } = getRuntime();
  const result = await submitIntake({
    pool,
    events,
    form,
    ownerUrl: ownerDatabaseUrl(),
  });
  if (result.passwordOnce) {
    await takePasswordOnce(pool, result.intake.id);
    await writeIntakeReveal({
      intakeId: result.intake.id,
      passwordOnce: result.passwordOnce,
    });
  }
  redirect(`/upphandling/bekraftelse?id=${encodeURIComponent(result.intake.id)}`);
}
