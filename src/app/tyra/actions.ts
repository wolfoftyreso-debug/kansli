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
