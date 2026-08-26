"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInquiry, parseAssessment, recordAssessment } from "@/lib/creditae/inquiries";
import { requireOrgAction } from "@/lib/platform/actions";

export async function registerCreditaeInquiry(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/creditae", "arende:write");
  const subjectOrgNumber = String(formData.get("subjectOrgNumber") ?? "").trim();
  const subjectName = String(formData.get("subjectName") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!subjectOrgNumber) return;
  let created;
  try {
    created = await createInquiry({
      pool,
      events,
      orgRef: session.org.ref,
      actorRef: session.sub,
      subjectOrgNumber,
      subjectName: subjectName || undefined,
      reason: reason || undefined,
      requestId: crypto.randomUUID(),
    });
  } catch {
    return;
  }
  revalidatePath("/creditae");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  redirect(`/creditae/${created.id}`);
}

export async function saveCreditaeAssessment(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/creditae", "arende:write");
  const id = String(formData.get("id") ?? "").trim();
  const assessment = parseAssessment(formData.get("assessment"));
  if (!id || !assessment) return;
  await recordAssessment({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    inquiryId: id,
    assessment,
    notes: String(formData.get("notes") ?? ""),
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/creditae");
  revalidatePath(`/creditae/${id}`);
  revalidatePath("/platform/events");
}
