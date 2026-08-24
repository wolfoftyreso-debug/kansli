"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgAction } from "@/lib/platform/actions";
import { createCase, parseCaseStatus, setCaseNotes, setCaseStatus } from "@/lib/alva/cases";
import { recordProtocolMeasurement, recordProtocolObservation } from "@/lib/alva/protocol";

export async function registerAlvaCase(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/alva", "arende:write");
  const complaint = String(formData.get("complaint") ?? "").trim();
  const vehicleRef = String(formData.get("vehicleRef") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const mileageRaw = String(formData.get("mileageKm") ?? "").trim();
  const desiredOutcome = String(formData.get("desiredOutcome") ?? "").trim();
  const mileageKm = mileageRaw ? Number(mileageRaw) : undefined;
  if (!complaint) return;
  const created = await createCase({
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
  redirect(`/alva/${created.id}`);
}

export async function saveAlvaCaseStatus(formData: FormData) {
  const { session, pool } = await requireOrgAction("/alva", "arende:write");
  const id = String(formData.get("id") ?? "").trim();
  const status = parseCaseStatus(formData.get("status"));
  if (!id || !status) return;
  await setCaseStatus({ pool, orgRef: session.org.ref, caseId: id, status });
  revalidatePath("/alva");
  revalidatePath(`/alva/${id}`);
}

export async function saveAlvaCaseNotes(formData: FormData) {
  const { session, pool } = await requireOrgAction("/alva", "arende:write");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await setCaseNotes({
    pool,
    orgRef: session.org.ref,
    caseId: id,
    notes: String(formData.get("notes") ?? ""),
  });
  revalidatePath(`/alva/${id}`);
}

export async function recordAlvaObservation(formData: FormData) {
  const { session, pool } = await requireOrgAction("/alva", "arende:write");
  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!id || !label) return;
  await recordProtocolObservation({
    pool,
    orgRef: session.org.ref,
    actorRef: session.sub,
    caseId: id,
    label,
    value: String(formData.get("value") ?? "unknown"),
  });
  revalidatePath(`/alva/${id}`);
}

export async function recordAlvaMeasurement(formData: FormData) {
  const { session, pool } = await requireOrgAction("/alva", "arende:write");
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const value = Number(String(formData.get("value") ?? "").replace(",", "."));
  if (!id || !name || !unit || !Number.isFinite(value)) return;
  await recordProtocolMeasurement({
    pool,
    orgRef: session.org.ref,
    actorRef: session.sub,
    caseId: id,
    name,
    value,
    unit,
  });
  revalidatePath(`/alva/${id}`);
}
