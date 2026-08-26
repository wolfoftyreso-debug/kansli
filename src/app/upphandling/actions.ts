"use server";

import { redirect } from "next/navigation";
import { completeIntakeSubmit } from "@/lib/kansli/complete-intake";
import { writeIntakeReveal } from "@/lib/kansli/intake-reveal";

export async function submitUpphandling(form: FormData) {
  const result = await completeIntakeSubmit(form);
  if (result.reveal) await writeIntakeReveal(result.reveal);
  redirect(result.path);
}
