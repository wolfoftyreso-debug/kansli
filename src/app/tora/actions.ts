"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAction } from "@/lib/platform/actions";
import { resolveViewTier } from "@/lib/tora/market";
import { persistSnapshot } from "@/lib/tora/persist";
import { resolveCompany, splitCsv, upsertCompanyProfile } from "@/lib/tora/profile";

export async function saveToraProfile(formData: FormData) {
  const { session, pool } = await requireOrgAction("/tora", "profile:write");
  const employeesRaw = String(formData.get("employees") ?? "").trim();
  await upsertCompanyProfile({
    pool,
    orgRef: session.org.ref,
    name: String(formData.get("name") ?? "").trim(),
    employees: employeesRaw && Number.isFinite(Number(employeesRaw)) ? Number(employeesRaw) : null,
    servesAreas: splitCsv(String(formData.get("servesAreas") ?? "")),
    capabilities: splitCsv(String(formData.get("capabilities") ?? "")),
    certifications: splitCsv(String(formData.get("certifications") ?? "")),
    registrations: splitCsv(String(formData.get("registrations") ?? "")),
  });
  revalidatePath("/tora");
  revalidatePath("/tora/calendar");
}

export async function publishToraMarket() {
  const { session, pool, events } = await requireOrgAction("/tora", "profile:write");
  const company = await resolveCompany(pool, session.org.ref);
  await persistSnapshot({
    pool,
    events,
    orgRef: session.org.ref,
    tier: resolveViewTier({
      sessionTier: session.org.tier,
      usingDemoCompany: company.id === "comp:tyresoel",
    }),
    actorRef: session.sub,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/tora");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
}
