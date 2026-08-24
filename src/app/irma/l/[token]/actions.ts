"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import { acknowledgeAgreement, irmaLinkPath, openAgreementByToken } from "@/lib/irma/agreements";
import { getRuntime } from "@/lib/platform/runtime";

export async function markIrmaViewed(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return;
  const runtime = getRuntime();
  await openAgreementByToken({
    pool: runtime.pool,
    events: runtime.events,
    token,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/irma");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  redirect(irmaLinkPath(token));
}

export async function acknowledgeIrmaAgreement(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const signerName = String(formData.get("signerName") ?? "").trim();
  const accepted = String(formData.get("accepted") ?? "") === "on";
  if (!token || !signerName || !accepted) return;
  const runtime = getRuntime();
  await acknowledgeAgreement({
    pool: runtime.pool,
    events: runtime.events,
    token,
    signerName,
    requestId: crypto.randomUUID(),
    declaration: ACKNOWLEDGEMENT_DECLARATION,
  });
  revalidatePath("/irma");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  redirect(irmaLinkPath(token));
}
