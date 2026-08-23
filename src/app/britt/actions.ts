"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAction } from "@/lib/platform/actions";
import { addObservation } from "@/lib/britt/observations";

export async function recordObservation(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/britt");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return;
  await addObservation({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    title,
    body,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/britt");
  revalidatePath("/platform/events");
}
