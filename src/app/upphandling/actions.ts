"use server";

import { redirect } from "next/navigation";
import { ownerDatabaseUrl } from "@/lib/platform/env";
import { getRuntime } from "@/lib/platform/runtime";
import { submitIntake } from "@/lib/kansli/submit-intake";

export async function submitUpphandling(form: FormData) {
  const { pool, events } = getRuntime();
  const result = await submitIntake({
    pool,
    events,
    form,
    ownerUrl: ownerDatabaseUrl(),
  });
  redirect(`/upphandling/bekraftelse?id=${encodeURIComponent(result.intake.id)}`);
}
