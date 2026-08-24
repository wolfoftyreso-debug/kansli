"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgAction } from "@/lib/platform/actions";
import { createAgreement } from "@/lib/irma/agreements";

export async function createIrmaAgreement(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/irma");
  const title = String(formData.get("title") ?? "").trim();
  const counterparty = String(formData.get("counterparty") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !counterparty) return;
  const agreement = await createAgreement({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    title,
    counterparty,
    body,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/irma");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  const link = agreement.magicLink ?? "";
  redirect(`/irma?issued=${encodeURIComponent(agreement.id)}&link=${encodeURIComponent(link)}`);
}
