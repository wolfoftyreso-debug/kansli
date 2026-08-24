"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAction } from "@/lib/platform/actions";
import { runIntel } from "@/lib/britt/intel";
import { addObservation, setObservationStatus } from "@/lib/britt/observations";

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
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
}

export async function closeObservation(formData: FormData) {
  const { session, pool } = await requireOrgAction("/britt", "finding:read");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await setObservationStatus({
    pool,
    orgRef: session.org.ref,
    id,
    status: "done",
  });
  revalidatePath("/britt");
}

export async function runBrittIntel() {
  const { session, pool, events } = await requireOrgAction("/britt");
  await runIntel({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
}
