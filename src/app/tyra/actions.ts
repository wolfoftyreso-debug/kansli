"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgAction } from "@/lib/platform/actions";
import {
  createCase,
  parseIntent,
  parseOperations,
  parseStepStatus,
  setStepStatus,
} from "@/lib/tyra/cases";
import { issueHubLink } from "@/lib/tyra/hub";
import { setIssuedHubLink } from "@/lib/tyra/issued-link";
import { buildReminderMessage, chooseChannel, enqueueReminder } from "@/lib/tyra/reminders";

export async function createTyraCase(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/tyra");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const registrationNumber = String(formData.get("registrationNumber") ?? "").trim();
  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const intent = parseIntent(formData.get("intent"));
  const operations = parseOperations(
    ["swapFromStorage", "wash", "balance", "storageIn", "quote"]
      .filter((key) => formData.get(key) === "on")
      .map((key) => {
        if (key === "swapFromStorage") return "TIRE_SWAP_FROM_STORAGE";
        if (key === "wash") return "WHEEL_WASH";
        if (key === "balance") return "WHEEL_BALANCE";
        if (key === "storageIn") return "STORAGE_IN";
        return "TIRE_QUOTE";
      }),
  );
  if (!customerName || !registrationNumber || operations.length === 0) return;
  const created = await createCase({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    customerName,
    registrationNumber,
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    make,
    model,
    intent,
    operations,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/tyra");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  redirect(`/tyra/cases/${created.id}`);
}

export async function updateTyraStep(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/tyra");
  const id = String(formData.get("id") ?? "").trim();
  const stepKind = String(formData.get("stepKind") ?? "").trim();
  const status = parseStepStatus(formData.get("status"));
  if (!id || !stepKind || !status) return;
  await setStepStatus({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    tireCaseId: id,
    stepKind,
    status,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/tyra");
  revalidatePath(`/tyra/cases/${id}`);
  revalidatePath("/britt");
  revalidatePath("/platform/events");
}

export async function issueTyraHubLink(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/tyra");
  const id = String(formData.get("id") ?? "").trim();
  const customerId = String(formData.get("customerId") ?? "").trim();
  if (!id || !customerId) return;
  const issued = await issueHubLink({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    customerId,
    requestId: crypto.randomUUID(),
  });
  await setIssuedHubLink(issued.token);
  revalidatePath("/tyra");
  revalidatePath(`/tyra/cases/${id}`);
  revalidatePath("/britt");
  revalidatePath("/platform/events");
  redirect(`/tyra/cases/${id}?issued=1`);
}

export async function enqueueTyraReminder(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/tyra");
  const id = String(formData.get("id") ?? "").trim();
  const registrationNumber = String(formData.get("registrationNumber") ?? "").trim();
  if (!id || !registrationNumber) return;
  const route = chooseChannel({
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!route) {
    redirect(`/tyra/cases/${id}`);
    return;
  }
  const senderName = String(formData.get("senderName") ?? session.org.name ?? "Verkstaden");
  const message = buildReminderMessage({
    kind: "season",
    targetSeason: "winter",
    customerName: String(formData.get("customerName") ?? ""),
    registrationNumber,
    make: String(formData.get("make") ?? ""),
    model: String(formData.get("model") ?? ""),
    senderName,
  });
  await enqueueReminder({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    customerId: String(formData.get("customerId") ?? "") || null,
    vehicleId: String(formData.get("vehicleId") ?? "") || null,
    reminderKey: `season:winter:${new Date().getUTCFullYear()}:${registrationNumber}`,
    channel: route.channel,
    recipient: route.recipient,
    subject: message.subject,
    body: message.body,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/tyra");
  revalidatePath(`/tyra/cases/${id}`);
  revalidatePath("/tyra/integrations");
  revalidatePath("/britt");
  revalidatePath("/platform/events");
  redirect(`/tyra/integrations`);
}
