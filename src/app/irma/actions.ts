"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgAction } from "@/lib/platform/actions";
import { createAgreement, reissueAgreementToken, revokeAgreement } from "@/lib/irma/agreements";
import { setIssuedLink } from "@/lib/irma/issued-link";
import { parseVerificationLevel } from "@/lib/irma/status";

export async function createIrmaAgreement(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/irma");
  const title = String(formData.get("title") ?? "").trim();
  const counterparty = String(formData.get("counterparty") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const verificationLevel = parseVerificationLevel(formData.get("requireAck") === "on" ? 1 : 0);
  if (!title || !counterparty) return;
  const agreement = await createAgreement({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    title,
    counterparty,
    body,
    verificationLevel,
    requestId: crypto.randomUUID(),
  });
  if (agreement.magicLink) await setIssuedLink(agreement.magicLink);
  revalidatePath("/irma");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  redirect("/irma?issued=1");
}

export async function reissueIrmaAgreement(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/irma");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const agreement = await reissueAgreementToken({
    pool,
    events,
    orgRef: session.org.ref,
    id,
    actorRef: session.sub,
    requestId: crypto.randomUUID(),
  });
  if (agreement?.magicLink) await setIssuedLink(agreement.magicLink);
  revalidatePath("/irma");
  revalidatePath(`/irma/${id}`);
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  redirect("/irma?issued=1");
}

export async function revokeIrmaAgreement(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/irma");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await revokeAgreement({
    pool,
    events,
    orgRef: session.org.ref,
    id,
    actorRef: session.sub,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/irma");
  revalidatePath(`/irma/${id}`);
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
}
