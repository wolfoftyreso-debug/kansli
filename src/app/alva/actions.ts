"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAction } from "@/lib/platform/actions";
import { createCase } from "@/lib/alva/cases";

export async function registerAlvaCase(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/alva");
  const complaint = String(formData.get("complaint") ?? "").trim();
  const vehicleRef = String(formData.get("vehicleRef") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const mileageRaw = String(formData.get("mileageKm") ?? "").trim();
  const desiredOutcome = String(formData.get("desiredOutcome") ?? "").trim();
  const mileageKm = mileageRaw ? Number(mileageRaw) : undefined;
  if (!complaint) return;
  await createCase({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    complaint,
    vehicleRef: vehicleRef || undefined,
    area: area || undefined,
    mileageKm: mileageKm !== undefined && Number.isFinite(mileageKm) ? mileageKm : undefined,
    desiredOutcome: desiredOutcome || undefined,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/alva");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
}
