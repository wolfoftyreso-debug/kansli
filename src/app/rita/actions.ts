"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgAction } from "@/lib/platform/actions";
import { requestAnalysis } from "@/lib/rita/analyses";

export async function requestRitaAnalysis(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/rita", "scan:run");
  const companyName = String(formData.get("companyName") ?? "").trim();
  const orgNumber = String(formData.get("orgNumber") ?? "").trim();
  if (!companyName || !orgNumber) return;
  const analysis = await requestAnalysis({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    companyName,
    orgNumber,
    requestId: crypto.randomUUID(),
    useDemoDocument: formData.get("useDemoDocument") === "on",
  });
  revalidatePath("/rita");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
  redirect(`/rita/${analysis.id}`);
}
